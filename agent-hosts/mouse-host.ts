import * as pulumi from "@pulumi/pulumi";
import { AgentHost, AgentHostArgs } from "./agent-host";

export interface MouseHostArgs {
    /**
     * Configuration arguments for the underlying AgentHost.
     */
    agentHostArgs: AgentHostArgs;
}

export class MouseHost extends pulumi.ComponentResource {
    public readonly agentHost: AgentHost;
    public readonly mouseEndpoint: pulumi.Output<string>;
    private readonly mouseHostArgs: MouseHostArgs;

    constructor(name: string, args: MouseHostArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:components:MouseHost", name, args, opts);
        this.mouseHostArgs = args;

        this.agentHost = this.createAgentHost(name);
        this.mouseEndpoint = this.createMouseEndpoint();

        this.registerOutputs({
            agentHost: this.agentHost,
            mouseEndpoint: this.mouseEndpoint,
        });
    }

    private createAgentHost(name: string): AgentHost {
        return new AgentHost(`${name}-host`, this.mouseHostArgs.agentHostArgs, { parent: this });
    }

    private createMouseEndpoint(): pulumi.Output<string> {
        return this.agentHost.cloudRunService.uri;
    }
}