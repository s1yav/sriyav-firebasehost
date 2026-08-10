import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as fs from "fs";
import * as path from "path";
import { ApphostBackendComponent } from "./apphost-backend-component";
import {
    APPHOST_BUILD_COMPONENT_TYPE,
    APPHOST_BUILD_RESOURCE_SUFFIX,
    BUILD_ID_PREFIX,
    BUILD_ID_VERSION_SUFFIX,
} from "../../constants";

/**
 * Arguments for creating the Firebase App Hosting Build resource.
 */
export interface ApphostBuildComponentArgs {
    /**
     * The Google Cloud project ID. Optional if inherited from parent component.
     */
    projectId?: pulumi.Input<string>;

    /**
     * The Google Cloud region. Optional if inherited from parent component.
     */
    region?: pulumi.Input<string>;

    /**
     * The GitOps configuration project ID.
     */
    gitopsProjectId: pulumi.Input<string>;

    /**
     * The cross-project GitOps Artifact Registry Docker repository name.
     */
    dockerRegistryName: pulumi.Input<string>;

    /**
     * The name of the website source repository (e.g. sriyav-portfolio).
     */
    websiteServerRepoName: pulumi.Input<string>;

    /**
     * The preferred git commit tag/version to fallback to (default is latest).
     */
    preferredCommit: string;

    /**
     * The name of the JSON file containing the build image tag.
     */
    imageTagFile: string;

    /**
     * The parent ApphostBackendComponent dependency.
     */
    backendComponent: ApphostBackendComponent;
}

interface DockerImageInfo {
    imageUrl: pulumi.Output<string>;
    buildIdSuffix: string;
}

interface ApphostBuildComponentOutputs {
    appHostingBuild: gcp.firebase.AppHostingBuild;
}

/**
 * A ComponentResource that manages Docker image resolution and provisions the Firebase App Hosting Build.
 */
export class ApphostBuildComponent extends pulumi.ComponentResource {
    public readonly appHostingBuild: gcp.firebase.AppHostingBuild;

    private readonly projectId: pulumi.Input<string>;
    private readonly region: pulumi.Input<string>;

    private readonly parentComponentName: string;
    private readonly parentComponentArgs: ApphostBuildComponentArgs;
    private readonly parentComponentOutputs: ApphostBuildComponentOutputs;

    constructor(name: string, args: ApphostBuildComponentArgs, opts?: pulumi.ComponentResourceOptions) {
        super(APPHOST_BUILD_COMPONENT_TYPE, name, args, opts);
        this.parentComponentName = name;
        this.parentComponentArgs = args;

        this.projectId = this.extractProjectId(args.projectId);
        this.region = this.extractRegion(args.region);

        this.appHostingBuild = this.createAppHostingBuild();
        this.parentComponentOutputs = this.constructParentComponentOutputs();
        this.registerOutputs(this.parentComponentOutputs);
    }

    private extractProjectId(projectId?: pulumi.Input<string>): pulumi.Input<string> {
        if (!projectId) {
            throw new Error("ApphostBuildComponent requires projectId argument.");
        }
        return projectId;
    }

    private extractRegion(region?: pulumi.Input<string>): pulumi.Input<string> {
        if (!region) {
            throw new Error("ApphostBuildComponent requires region argument.");
        }
        return region;
    }

    private constructParentComponentOutputs(): ApphostBuildComponentOutputs {
        return {
            appHostingBuild: this.appHostingBuild,
        };
    }

    private createAppHostingBuild(): gcp.firebase.AppHostingBuild {
        const resourceName = this.constructChildResourceName(APPHOST_BUILD_RESOURCE_SUFFIX);
        const buildArgs = this.constructBuildArgs();
        const options = this.constructBuildResourceOptions();
        return new gcp.firebase.AppHostingBuild(resourceName, buildArgs, options);
    }

    private constructBuildResourceOptions(): pulumi.ComponentResourceOptions {
        const dependsOn = this.resolveBuildDependencies();
        return { parent: this, dependsOn };
    }

    private resolveBuildDependencies(): pulumi.Resource[] {
        return [this.parentComponentArgs.backendComponent];
    }

    private constructBuildArgs(): gcp.firebase.AppHostingBuildArgs {
        const imageInfo = this.resolveDockerImageInfo();
        const backendId = this.resolveBackendId();
        return {
            project: this.projectId,
            location: this.region,
            backend: backendId,
            buildId: this.formatBuildId(imageInfo.buildIdSuffix),
            source: this.constructBuildSource(imageInfo.imageUrl),
        };
    }

    private resolveBackendId(): pulumi.Input<string> {
        return this.parentComponentArgs.backendComponent.appHostingBackend.backendId;
    }

    private constructBuildSource(imageUrl: pulumi.Output<string>) {
        return {
            container: {
                image: imageUrl,
            },
        };
    }

    private formatBuildId(suffix: string): string {
        return `${BUILD_ID_PREFIX}${suffix}${BUILD_ID_VERSION_SUFFIX}`.slice(0, 30);
    }

    private resolveDockerImageInfo(): DockerImageInfo {
        const commitSha = this.resolveCommitSha();
        const imageUrl = this.constructDockerImageUrl(commitSha);
        const buildIdSuffix = this.extractBuildIdSuffix(commitSha);
        return { imageUrl, buildIdSuffix };
    }

    private resolveCommitSha(): string {
        try {
            return this.readCommitShaFromFile();
        } catch (err) {
            return this.getFallbackCommitSha(err);
        }
    }

    private readCommitShaFromFile(): string {
        const filePath = path.join(__dirname, "..", "..", this.parentComponentArgs.imageTagFile);
        const content = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(content);
        return parsed.commitSha ? parsed.commitSha.toLowerCase().trim() : this.parentComponentArgs.preferredCommit;
    }

    private getFallbackCommitSha(err: unknown): string {
        pulumi.log.warn(`Failed to read ${this.parentComponentArgs.imageTagFile}: ${err}. Falling back to '${this.parentComponentArgs.preferredCommit}'`);
        return this.parentComponentArgs.preferredCommit;
    }

    private constructDockerImageUrl(commitSha: string): pulumi.Output<string> {
        const { gitopsProjectId, dockerRegistryName, websiteServerRepoName } = this.parentComponentArgs;
        return pulumi.interpolate`${this.region}-docker.pkg.dev/${gitopsProjectId}/${dockerRegistryName}/${websiteServerRepoName}:${commitSha}`;
    }

    private extractBuildIdSuffix(commitSha: string): string {
        return commitSha === "latest" ? "latest" : commitSha.substring(0, 7);
    }

    private constructChildResourceName(resourceSuffix: string): string {
        return `${this.parentComponentName}-${resourceSuffix}`;
    }
}
