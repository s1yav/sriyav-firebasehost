import { expect } from "chai";
import { setupMocks, promiseOf } from "./setup";
import { ProjectsServiceEnable } from "../components/projects-service-enable";

describe("ProjectsServiceEnable component", () => {
    before(() => {
        setupMocks();
    });

    it("should enable firebase and firebaseapphosting services", async () => {
        const component = new ProjectsServiceEnable("test-enable", {
            projectId: "test-project-id",
        });

        const firebaseServiceProject = await promiseOf(component.firebaseService.project);
        const firebaseServiceService = await promiseOf(component.firebaseService.service);
        const firebaseServiceDisableOnDestroy = await promiseOf(component.firebaseService.disableOnDestroy);

        expect(firebaseServiceProject).to.equal("test-project-id");
        expect(firebaseServiceService).to.equal("firebase.googleapis.com");
        expect(firebaseServiceDisableOnDestroy).to.be.false;

        const apphostingServiceProject = await promiseOf(component.firebaseapphostingService.project);
        const apphostingServiceService = await promiseOf(component.firebaseapphostingService.service);
        const apphostingServiceDisableOnDestroy = await promiseOf(component.firebaseapphostingService.disableOnDestroy);

        expect(apphostingServiceProject).to.equal("test-project-id");
        expect(apphostingServiceService).to.equal("firebaseapphosting.googleapis.com");
        expect(apphostingServiceDisableOnDestroy).to.be.false;
    });
});
