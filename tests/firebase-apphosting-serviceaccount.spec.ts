import { expect } from "chai";
import { setupMocks, promiseOf } from "./setup";
import { IdentityComponent } from "../components/identity-component";

describe("IdentityComponent", () => {
    before(() => {
        setupMocks();
    });

    it("should provision custom service account and assign roles", async () => {
        const component = new IdentityComponent("test-sa", {
            projectId: "test-project-id",
            gitopsCloudbuildSa: "cloudbuild@gitops-proj.iam.gserviceaccount.com",
        });

        const accountId = await promiseOf(component.firebaseServiceAccount.accountId);
        const displayName = await promiseOf(component.firebaseServiceAccount.displayName);
        const saProject = await promiseOf(component.firebaseServiceAccount.project);

        expect(accountId).to.equal("sriyav-firebasehost-sa");
        expect(displayName).to.equal("Firebase App Hosting compute service account");
        expect(saProject).to.equal("test-project-id");

        const memberRole = await promiseOf(component.firebaseServiceAccountOwnerRoleMember.role);
        const memberProject = await promiseOf(component.firebaseServiceAccountOwnerRoleMember.project);
        expect(memberRole).to.equal("roles/owner");
        expect(memberProject).to.equal("test-project-id");

        const impersonationRole = await promiseOf(component.firebaseServiceAccountImpersonator.role);
        const impersonationMember = await promiseOf(component.firebaseServiceAccountImpersonator.member);
        expect(impersonationRole).to.equal("roles/iam.serviceAccountTokenCreator");
        expect(impersonationMember).to.equal("serviceAccount:cloudbuild@gitops-proj.iam.gserviceaccount.com");

        // Verify Mouse Agent service account and Vertex AI role member
        const mouseSaId = await promiseOf(component.mouseAgentServiceAccount.accountId);
        const mouseSaDisplayName = await promiseOf(component.mouseAgentServiceAccount.displayName);
        const mouseSaProject = await promiseOf(component.mouseAgentServiceAccount.project);
        expect(mouseSaId).to.equal("mouse-agent-sa");
        expect(mouseSaDisplayName).to.equal("Mouse Agent Cloud Run service account");
        expect(mouseSaProject).to.equal("test-project-id");

        const vertexRole = await promiseOf(component.mouseAgentVertexRoleMember.role);
        const vertexMember = await promiseOf(component.mouseAgentVertexRoleMember.member);
        const vertexProject = await promiseOf(component.mouseAgentVertexRoleMember.project);
        expect(vertexRole).to.equal("roles/aiplatform.user");
        expect(vertexProject).to.equal("test-project-id");
        expect(vertexMember).to.equal("serviceAccount:mouse-agent-sa@test-project-id.iam.gserviceaccount.com");
    });
});
