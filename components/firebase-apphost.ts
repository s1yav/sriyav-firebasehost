import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as fs from "fs";
import * as path from "path";

/**
 * Arguments for configuring and deploying the Firebase App Hosting resources.
 */
export interface FirebaseApphostArgs {
    /**
     * The Google Cloud project ID.
     */
    projectId: pulumi.Input<string>;

    /**
     * The Google Cloud region to deploy the App Hosting backend to.
     */
    region: pulumi.Input<string>;

    /**
     * The associated Firebase Web App ID.
     */
    appId: pulumi.Input<string>;

    /**
     * The email of the compute service account used by App Hosting.
     */
    computeServiceAccountEmail: pulumi.Input<string>;

    /**
     * The enabled projects service resource dependency.
     */
    appHostingService: gcp.projects.Service;

    /**
     * The service account IAM member resource dependency.
     */
    appHostingServiceAccountIamMember: gcp.projects.IAMMember;

    /**
     * The GitOps configuration project ID.
     */
    gitopsProjectId: pulumi.Input<string>;

    /**
     * The cross-project GitOps Artifact Registry Docker repository name.
     */
    dockerRegistryName: pulumi.Input<string>;

    /**
     * The domain name to map to the App Hosting backend (e.g. sriyav.com).
     */
    domainId: pulumi.Input<string>;

    /**
     * The preferred git commit tag/version to fallback to (default is latest).
     */
    preferredCommit: string;

    /**
     * The name of the JSON file containing the build image tag.
     */
    imageTagFile: string;

    /**
     * The name of the website source repository (e.g. sriyav-portfolio).
     */
    websiteServerRepoName: pulumi.Input<string>;

    /**
     * The serving locality configuration (e.g. GLOBAL_ACCESS).
     */
    servingLocality: pulumi.Input<string>;
}

/**
 * A ComponentResource that deploys the Firebase App Hosting Backend, provisions builds,
 * manages traffic splits, and configures custom domain mappings.
 */
export class FirebaseApphost extends pulumi.ComponentResource {
    /**
     * The Firebase App Hosting Backend instance.
     */
    public readonly appHostingBackend: gcp.firebase.AppHostingBackend;

    /**
     * The Firebase App Hosting Build instance representing the deployed web application version.
     */
    public readonly appHostingBuild: gcp.firebase.AppHostingBuild;

    /**
     * The Firebase App Hosting Traffic split configuration directing 100% traffic to the build.
     */
    public readonly appHostingTraffic: gcp.firebase.AppHostingTraffic;

    /**
     * The Custom Domain mapping for the App Hosting backend.
     */
    public readonly appHostingDomain: gcp.firebase.AppHostingDomain;

    /**
     * Creates a new instance of FirebaseApphost.
     *
     * @param name The logical name of the resource.
     * @param args The arguments to configure the resource.
     * @param opts A bag of options that controls this resource's behavior.
     */
    constructor(name: string, args: FirebaseApphostArgs, opts?: pulumi.ComponentResourceOptions) {
        const stack = pulumi.getStack();
        const componentOpts = pulumi.mergeOptions(opts, {
            aliases: [
                { type: "custom:components:FirebaseApphost", name: "sriyav-portfolio" }
            ]
        });
        super("custom:components:FirebaseApphost", name, args, componentOpts);

        this.appHostingBackend = new gcp.firebase.AppHostingBackend(`${name}-appHostingBackend`, {
            project: args.projectId,
            location: args.region,
            backendId: args.websiteServerRepoName,
            appId: args.appId,
            servingLocality: args.servingLocality,
            serviceAccount: args.computeServiceAccountEmail,
        }, {
            parent: this,
            dependsOn: [args.appHostingService, args.appHostingServiceAccountIamMember],
        });

        const { imageUrl, buildIdSuffix } = this.getDockerImage(
            args.region,
            args.gitopsProjectId,
            args.dockerRegistryName,
            args.preferredCommit,
            args.imageTagFile,
            args.websiteServerRepoName
        );

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
        }, {
            parent: this,
            dependsOn: [this.appHostingBackend],
            aliases: [
                `urn:pulumi:${stack}::sriyav-firebasehost::custom:components:FirebaseApphost$gcp:firebase/appHostingBuild:AppHostingBuild::sriyav-portfolio-appHostingBuild`
            ]
        });

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
        }, {
            parent: this,
            dependsOn: [this.appHostingBuild],
            aliases: [
                `urn:pulumi:${stack}::sriyav-firebasehost::custom:components:FirebaseApphost$gcp:firebase/appHostingTraffic:AppHostingTraffic::sriyav-portfolio-appHostingTraffic`
            ]
        });

        this.appHostingDomain = new gcp.firebase.AppHostingDomain(`${name}-appHostingDomain`, {
            project: args.projectId,
            location: args.region,
            backend: this.appHostingBackend.backendId,
            domainId: args.domainId,
        }, {
            parent: this,
            dependsOn: [this.appHostingBackend],
            aliases: [
                `urn:pulumi:${stack}::sriyav-firebasehost::custom:components:FirebaseApphost$gcp:firebase/appHostingDomain:AppHostingDomain::sriyav-portfolio-appHostingDomain`
            ]
        });

        this.registerOutputs({
            appHostingBackend: this.appHostingBackend,
            appHostingBuild: this.appHostingBuild,
            appHostingTraffic: this.appHostingTraffic,
            appHostingDomain: this.appHostingDomain,
        });
    }

    /**
     * Resolves the Docker image tag/SHA and returns the formatted Artifact Registry URL and build suffix.
     */
    private getDockerImage(
        region: pulumi.Input<string>,
        gitopsProjectId: pulumi.Input<string>,
        dockerRegistryName: pulumi.Input<string>,
        preferredCommit: string,
        imageTagFile: string,
        websiteServerRepoName: pulumi.Input<string>
    ): { imageUrl: pulumi.Output<string>; buildIdSuffix: string } {
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
        const imageUrl = pulumi.interpolate`${region}-docker.pkg.dev/${gitopsProjectId}/${dockerRegistryName}/${websiteServerRepoName}:${commitSha}`;
        const buildIdSuffix = commitSha === "latest" ? "latest" : commitSha.substring(0, 7);

        return { imageUrl, buildIdSuffix };
    }
}
