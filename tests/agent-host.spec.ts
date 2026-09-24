import { expect } from "chai";
import { setupMocks, promiseOf } from "./setup";
import { AgentHost } from "../agent-hosts/agent-host";
import { MouseHost } from "../agent-hosts/mouse-host";

describe("AgentHost Component", () => {
    before(() => {
        setupMocks();
    });

    it("should provision CloudRunV2Service inside AgentHost component using cloudRunArgs", async () => {
        const agentHost = new AgentHost("test-agent-host", {
            cloudRunArgs: {
                serviceName: "agent-host-service",
                location: "us-central1",
                image: "us-docker.pkg.dev/test-project/test-repo/test-image:latest",
                maxInstanceCount: 5,
                cpuLimit: "4",
                memoryLimit: "2048Mi",
            },
        });

        expect(agentHost).to.be.an.instanceOf(AgentHost);
        expect(agentHost.cloudRunService).to.exist;

        const location = await promiseOf(agentHost.cloudRunService.service.location);
        const name = await promiseOf(agentHost.cloudRunService.service.name);

        expect(location).to.equal("us-central1");
        expect(name).to.equal("agent-host-service");
    });

    it("should provision CloudRunV2Service inside AgentHost component using agentImage directly", async () => {
        const agentHost = new AgentHost("test-agent-host-direct", {
            agentImage: "us-docker.pkg.dev/test-project/test-repo/custom-agent:v1",
            location: "us-central1",
            serviceName: "custom-agent-service",
        });

        expect(agentHost).to.be.an.instanceOf(AgentHost);
        expect(agentHost.cloudRunService).to.exist;
        expect(agentHost.serviceUrl).to.exist;

        const name = await promiseOf(agentHost.cloudRunService.service.name);
        expect(name).to.equal("custom-agent-service");
    });

    it("should provision MouseHost wrapping an AgentHost and exposing mouseEndpoint", async () => {
        const mouseHost = new MouseHost("mouse-agent", {
            agentHostArgs: {
                cloudRunArgs: {
                    serviceName: "mouse-flow-server",
                    location: "us-central1",
                    image: "us-docker.pkg.dev/test-project/test-repo/mouse:latest",
                },
            },
        });

        expect(mouseHost).to.be.an.instanceOf(MouseHost);
        expect(mouseHost.agentHost).to.exist;
        expect(mouseHost.mouseEndpoint).to.exist;
    });

    it("should provision MouseHost resolving image from mouse-agent-image-tag.json", async () => {
        const mouseHost = new MouseHost("mouse-agent-auto", {
            gitopsProjectId: "my-gitops-project",
            dockerRegistryName: "my-registry",
            location: "us-central1",
            imageTagFile: "mouse-agent-image-tag.json",
        });

        expect(mouseHost).to.be.an.instanceOf(MouseHost);
        expect(mouseHost.agentHost).to.exist;
        expect(mouseHost.mouseEndpoint).to.exist;

        const containerImage = await promiseOf(
            mouseHost.agentHost.cloudRunService.service.template.containers[0].image
        );
        expect(containerImage).to.equal(
            "us-central1-docker.pkg.dev/my-gitops-project/my-registry/mouse:5f6be915a77fb93757f6fd7ca1191a6e04bb8124"
        );
    });

    it("should fallback to preferredCommit if image tag file does not exist", async () => {
        const mouseHost = new MouseHost("mouse-agent-fallback", {
            gitopsProjectId: "my-gitops-project",
            dockerRegistryName: "my-registry",
            location: "us-central1",
            imageTagFile: "non-existent-tag.json",
            preferredCommit: "fallbacksha999",
        });

        const containerImage = await promiseOf(
            mouseHost.agentHost.cloudRunService.service.template.containers[0].image
        );
        expect(containerImage).to.equal(
            "us-central1-docker.pkg.dev/my-gitops-project/my-registry/mouse:fallbacksha999"
        );
    });
});
