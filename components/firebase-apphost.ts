import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as fs from "fs";
import * as path from "path";
import { gitopsProjectId, dockerRegistryName, domainId, preferredCommit, imageTagFile } from "../configuration";

export interface FirebaseApphostArgs {
    projectId: pulumi.Input<string>;
    region: pulumi.Input<string>;
    appId: pulumi.Input<string>;
    computeServiceAccountEmail: pulumi.Input<string>;
    appHostingService: gcp.projects.Service;
    appHostingIamMemberRunner: gcp.projects.IAMMember;
}

export class FirebaseApphost extends pulumi.ComponentResource {
    public readonly appHostingBackend: gcp.firebase.AppHostingBackend;
    public readonly appHostingBuild: gcp.firebase.AppHostingBuild;
    public readonly appHostingTraffic: gcp.firebase.AppHostingTraffic;
    public readonly appHostingDomain: gcp.firebase.AppHostingDomain;

    constructor(name: string, args: FirebaseApphostArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:FirebaseApphost", name, args, opts);

        this.appHostingBackend = new gcp.firebase.AppHostingBackend(`${name}-appHostingBackend`, {
            project: args.projectId,
            location: args.region,
            backendId: "sriyav-portfolio",
            appId: args.appId,
            servingLocality: "GLOBAL_ACCESS",
            serviceAccount: args.computeServiceAccountEmail,
        }, { parent: this, dependsOn: [args.appHostingService, args.appHostingIamMemberRunner] });

        const { imageUrl, buildIdSuffix } = this.getDockerImage(args.region);

        this.appHostingBuild = new gcp.firebase.AppHostingBuild(`${name}-appHostingBuild`, {
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

        this.appHostingTraffic = new gcp.firebase.AppHostingTraffic(`${name}-appHostingTraffic`, {
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

        this.appHostingDomain = new gcp.firebase.AppHostingDomain(`${name}-appHostingDomain`, {
            project: args.projectId,
            location: args.region,
            backend: this.appHostingBackend.backendId,
            domainId: domainId,
        }, { parent: this, dependsOn: [this.appHostingBackend] });

        this.registerOutputs({
            appHostingBackend: this.appHostingBackend,
            appHostingBuild: this.appHostingBuild,
            appHostingTraffic: this.appHostingTraffic,
            appHostingDomain: this.appHostingDomain,
        });
    }

    private getDockerImage(region: pulumi.Input<string>): { imageUrl: pulumi.Output<string>; buildIdSuffix: string } {
        // Load the portfolio docker image commit SHA from the config file
        let commitSha = preferredCommit;
        try {
            const fileContent = fs.readFileSync(path.join(__dirname, "..", imageTagFile), "utf8");
            const tagData = JSON.parse(fileContent);
            if (tagData.commitSha) {
                commitSha = tagData.commitSha.toLowerCase().trim();
            }
        } catch (err) {
            pulumi.log.warn(`Failed to read ${imageTagFile}: ${err}. Falling back to '${preferredCommit}'`);
        }

        // Docker image URL in gitops docker repository
        const imageUrl = pulumi.interpolate`${region}-docker.pkg.dev/${gitopsProjectId}/${dockerRegistryName}/sriyav-portfolio:${commitSha}`;
        const buildIdSuffix = commitSha === "latest" ? "latest" : commitSha.substring(0, 7);

        return { imageUrl, buildIdSuffix };
    }
}
