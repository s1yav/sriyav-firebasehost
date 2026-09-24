import { expect } from "chai";
import { setupMocks, promiseOf } from "./setup";
import { Platform } from "../agent-platform/platform";

describe("Platform Component", () => {
    before(() => {
        setupMocks();
    });

    it("should provision CloudRunV2Service inside Platform component using cloudRunArgs", async () => {
        const platform = new Platform("test-platform", {
            cloudRunArgs: {
                serviceName: "agent-platform-service",
                location: "us-central1",
                image: "us-docker.pkg.dev/test-project/test-repo/test-image:latest",
                maxInstanceCount: 5,
                cpuLimit: "4",
                memoryLimit: "2048Mi",
            },
        });

        expect(platform).to.be.an.instanceOf(Platform);
        expect(platform.cloudRunService).to.exist;

        const location = await promiseOf(platform.cloudRunService.service.location);
        const name = await promiseOf(platform.cloudRunService.service.name);

        expect(location).to.equal("us-central1");
        expect(name).to.equal("agent-platform-service");
    });
});
