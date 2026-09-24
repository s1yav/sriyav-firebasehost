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
});
