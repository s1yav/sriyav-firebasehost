import * as pulumi from "@pulumi/pulumi";
import * as fs from "fs";
import * as path from "path";
import { AgentHost, AgentHostArgs } from "./agent-host";
import {
    MOUSE_HOST_COMPONENT_TYPE,
    AGENT_HOSTS_IMAGE_TAGS_DIR,
    MOUSE_AGENT_IMAGE_TAG_FILE,
    MOUSE_AGENT_DEFAULT_IMAGE_NAME,
} from "../constants";

export interface MouseHostArgs {
    /**
     * Optional agent image override (skips image tag resolution if provided).
     */
    agentImage?: pulumi.Input<string>;

    /**
     * The GitOps configuration project ID where Docker images are stored.
     */
    gitopsProjectId?: pulumi.Input<string>;

    /**
     * The Artifact Registry Docker repository name.
     */
    dockerRegistryName?: pulumi.Input<string>;

    /**
     * The name of the Docker image repository (defaults to "mouse").
     */
    imageName?: string;

    /**
     * The GCP region for the Cloud Run service and Artifact Registry (defaults to "us-central1").
     */
    location?: pulumi.Input<string>;

    /**
     * Path or filename of the JSON file containing the commit SHA. Defaults to "mouse-agent-image-tag.json".
     */
    imageTagFile?: string;

    /**
     * Fallback commit SHA if tag file is not found. Defaults to "latest".
     */
    preferredCommit?: string;

    /**
     * Optional custom Cloud Run service name.
     */
    serviceName?: pulumi.Input<string>;

    /**
     * Optional service account email running the Cloud Run service.
     */
    serviceAccount?: pulumi.Input<string>;

    /**
     * Optional environment variables for the container.
     */
    envs?: AgentHostArgs["envs"];

    /**
     * Optional direct AgentHost arguments override.
     */
    agentHostArgs?: AgentHostArgs;
}

interface MouseHostOutputs {
    readonly mouseEndpoint: pulumi.Output<string>;
}

export class MouseHost extends pulumi.ComponentResource {
    public readonly mouseEndpoint: pulumi.Output<string>;
    public readonly agentHost: AgentHost;
    private readonly mouseHostArgs: MouseHostArgs;

    constructor(name: string, args: MouseHostArgs = {}, opts?: pulumi.ComponentResourceOptions) {
        super(MOUSE_HOST_COMPONENT_TYPE, name, args, opts);
        this.mouseHostArgs = args;

        this.agentHost = this.createAgentHost(name);
        this.mouseEndpoint = this.agentHost.serviceUrl;

        this.registerOutputs({
            mouseEndpoint: this.mouseEndpoint,
        });
    }

    private createAgentHost(name: string): AgentHost {
        const agentHostArgs = this.resolveAgentHostArgs();
        return new AgentHost(`${name}-host`, agentHostArgs, { parent: this });
    }

    private resolveAgentHostArgs(): AgentHostArgs {
        if (this.mouseHostArgs.agentHostArgs) {
            return this.mouseHostArgs.agentHostArgs;
        }

        const agentImage = this.mouseHostArgs.agentImage ?? this.resolveDockerImage();
        const defaultEnvs = [
            { name: "MOUSE_PORT", value: "8080" },
            { name: "PORT", value: "8080" },
        ];
        return {
            agentImage,
            location: this.mouseHostArgs.location,
            serviceName: this.mouseHostArgs.serviceName,
            serviceAccount: this.mouseHostArgs.serviceAccount,
            envs: this.mouseHostArgs.envs ?? defaultEnvs,
        };
    }

    private resolveDockerImage(): pulumi.Input<string> {
        const commitSha = this.resolveCommitSha();
        return this.constructDockerImageUrl(commitSha);
    }

    private resolveCommitSha(): string {
        try {
            return this.readCommitShaFromFile();
        } catch (err) {
            return this.getFallbackCommitSha(err);
        }
    }

    private readCommitShaFromFile(): string {
        const tagFile = this.mouseHostArgs.imageTagFile ?? MOUSE_AGENT_IMAGE_TAG_FILE;
        const filePath = this.resolveTagFilePath(tagFile);
        const content = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(content);
        return parsed.commitSha ? parsed.commitSha.toLowerCase().trim() : (this.mouseHostArgs.preferredCommit ?? "latest");
    }

    private resolveTagFilePath(tagFile: string): string {
        if (path.isAbsolute(tagFile)) {
            return tagFile;
        }

        const candidatePaths = [
            path.join(__dirname, AGENT_HOSTS_IMAGE_TAGS_DIR, tagFile),
            path.join(__dirname, tagFile),
            path.join(__dirname, "..", tagFile),
        ];

        for (const candidate of candidatePaths) {
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        }

        return candidatePaths[0];
    }

    private getFallbackCommitSha(err: unknown): string {
        const fallback = this.mouseHostArgs.preferredCommit ?? "latest";
        const tagFile = this.mouseHostArgs.imageTagFile ?? MOUSE_AGENT_IMAGE_TAG_FILE;
        pulumi.log.warn(`Failed to read ${tagFile}: ${err}. Falling back to '${fallback}'`);
        return fallback;
    }

    private constructDockerImageUrl(commitSha: string): pulumi.Output<string> {
        const gitopsConfig = this.loadGitopsConfig();
        const gitopsProjectId = this.mouseHostArgs.gitopsProjectId ?? gitopsConfig.gitopsProjectId ?? "test-gitops-project";
        const dockerRegistryName = this.mouseHostArgs.dockerRegistryName ?? gitopsConfig.dockerRegistryName ?? "test-docker-registry";
        const region = this.mouseHostArgs.location ?? gitopsConfig.region ?? "us-central1";
        const imageName = this.mouseHostArgs.imageName ?? MOUSE_AGENT_DEFAULT_IMAGE_NAME;

        return pulumi.interpolate`${region}-docker.pkg.dev/${gitopsProjectId}/${dockerRegistryName}/${imageName}:${commitSha}`;
    }

    private loadGitopsConfig(): { gitopsProjectId?: pulumi.Output<string>; dockerRegistryName?: pulumi.Output<string>; region?: string } {
        try {
            const gitopsConfig = new pulumi.Config("gitops");
            const gcpConfig = new pulumi.Config("gcp");
            return {
                gitopsProjectId: gitopsConfig.getSecret("projectId"),
                dockerRegistryName: gitopsConfig.getSecret("dockerRegistryName"),
                region: gcpConfig.get("region"),
            };
        } catch {
            return {};
        }
    }
}