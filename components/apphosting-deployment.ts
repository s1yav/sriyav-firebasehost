import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as fs from "fs";
import * as path from "path";

export interface AppHostingDeploymentArgs {
    projectId: pulumi.Input<string>;
    region: pulumi.Input<string>;
    appId: pulumi.Input<string>;
    computeServiceAccountEmail: pulumi.Input<string>;
    appHostingService: gcp.projects.Service;
    appHostingIamMemberRunner: gcp.projects.IAMMember;
}

export class AppHostingDeployment extends pulumi.ComponentResource {
    public readonly appHostingBackend: gcp.firebase.AppHostingBackend;
    public readonly appHostingBuild: gcp.firebase.AppHostingBuild;
    public readonly appHostingTraffic: gcp.firebase.AppHostingTraffic;
    public readonly appHostingDomain: gcp.firebase.AppHostingDomain;

    constructor(name: string, args: AppHostingDeploymentArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:AppHostingDeployment", name, args, opts);

        this.appHostingBackend = new gcp.firebase.AppHostingBackend(`${name}-backend`, {
            project: args.projectId,
            location: args.region,
            backendId: "sriyav-portfolio",
            appId: args.appId,
            servingLocality: "GLOBAL_ACCESS",
            serviceAccount: args.computeServiceAccountEmail,
        }, { parent: this, dependsOn: [args.appHostingService, args.appHostingIamMemberRunner] });

        // Load the portfolio docker image commit SHA from the config file
        let commitSha = "latest";
        try {
            const fileContent = fs.readFileSync(path.join(__dirname, "..", "portfolio-image-tag.json"), "utf8");
            const tagData = JSON.parse(fileContent);
            if (tagData.commitSha) {
                commitSha = tagData.commitSha.toLowerCase().trim();
            }
        } catch (err) {
            pulumi.log.warn(`Failed to read portfolio-image-tag.json: ${err}. Falling back to 'latest'`);
        }

        // Docker image URL in the cross-project Artifact Registry (in sriyav0599-gitops)
        const dockerRegistryName = "s1yav-repositorydocker";
        const gitopsProjectId = "sriyav0599-gitops";
        const imageUrl = pulumi.interpolate`${args.region}-docker.pkg.dev/${gitopsProjectId}/${dockerRegistryName}/sriyav-portfolio:${commitSha}`;

        const buildIdSuffix = commitSha === "latest" ? "latest" : commitSha.substring(0, 7);

        this.appHostingBuild = new gcp.firebase.AppHostingBuild(`${name}-build`, {
            project: args.projectId,
            location: args.region,
            backend: this.appHostingBackend.backendId,
            buildId: `build-${buildIdSuffix}-v3`.slice(0, 30),
            source: {
                container: {
                    image: imageUrl,
                },
            },
        }, { parent: this, dependsOn: [this.appHostingBackend] });

        this.appHostingTraffic = new gcp.firebase.AppHostingTraffic(`${name}-traffic`, {
            project: args.projectId,
            location: args.region,
            backend: this.appHostingBackend.backendId,
            target: {
                splits: [{
                    build: this.appHostingBuild.name,
                    percent: 100,
                }],
            },
        }, { parent: this, dependsOn: [this.appHostingBuild] });

        this.appHostingDomain = new gcp.firebase.AppHostingDomain(`${name}-domain`, {
            project: args.projectId,
            location: args.region,
            backend: this.appHostingBackend.backendId,
            domainId: "sriyav.com",
        }, { parent: this, dependsOn: [this.appHostingBackend] });

        this.registerOutputs({
            appHostingBackend: this.appHostingBackend,
            appHostingBuild: this.appHostingBuild,
            appHostingTraffic: this.appHostingTraffic,
            appHostingDomain: this.appHostingDomain,
        });
    }
}
