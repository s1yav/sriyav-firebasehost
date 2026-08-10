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
    });
});
