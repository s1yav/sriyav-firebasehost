import { expect } from "chai";
import { setupMocks, promiseOf } from "./setup";
import { WebAppComponent } from "../components/webapp-component";

describe("WebAppComponent", () => {
    before(() => {
        setupMocks();
    });

    it("should register a Firebase Web App", async () => {
        const component = new WebAppComponent("test-webapp", {
            projectId: "test-project-id",
            displayName: "my-test-web-app",
        });

        const webAppProj = await promiseOf(component.firebaseWebApp.project);
        const webAppDisplayName = await promiseOf(component.firebaseWebApp.displayName);

        expect(webAppProj).to.equal("test-project-id");
        expect(webAppDisplayName).to.equal("my-test-web-app");
    });
});
