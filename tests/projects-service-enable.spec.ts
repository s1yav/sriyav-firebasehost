import { expect } from "chai";
import { setupMocks, promiseOf } from "./setup";
import { EnableServiceComponent } from "../components/enable-service-component";

describe("EnableServiceComponent", () => {
    before(() => {
        setupMocks();
    });

    it("should enable firebase and firebaseapphosting services", async () => {
        const component = new EnableServiceComponent("test-enable", {
            projectId: "test-project-id",
        });

        const firebaseServiceProject = await promiseOf(component.firebaseServiceEnabled.project);
        const firebaseServiceService = await promiseOf(component.firebaseServiceEnabled.service);
        const firebaseServiceDisableOnDestroy = await promiseOf(component.firebaseServiceEnabled.disableOnDestroy);

        expect(firebaseServiceProject).to.equal("test-project-id");
        expect(firebaseServiceService).to.equal("firebase.googleapis.com");
        expect(firebaseServiceDisableOnDestroy).to.be.false;

        const apphostingServiceProject = await promiseOf(component.firebaseapphostingServiceEnabled.project);
        const apphostingServiceService = await promiseOf(component.firebaseapphostingServiceEnabled.service);
        const apphostingServiceDisableOnDestroy = await promiseOf(component.firebaseapphostingServiceEnabled.disableOnDestroy);

        expect(apphostingServiceProject).to.equal("test-project-id");
        expect(apphostingServiceService).to.equal("firebaseapphosting.googleapis.com");
        expect(apphostingServiceDisableOnDestroy).to.be.false;

        const aiplatformServiceProject = await promiseOf(component.aiplatformServiceEnabled.project);
        const aiplatformServiceService = await promiseOf(component.aiplatformServiceEnabled.service);
        const aiplatformServiceDisableOnDestroy = await promiseOf(component.aiplatformServiceEnabled.disableOnDestroy);

        expect(aiplatformServiceProject).to.equal("test-project-id");
        expect(aiplatformServiceService).to.equal("aiplatform.googleapis.com");
        expect(aiplatformServiceDisableOnDestroy).to.be.false;
    });
});
