import { expect } from "chai";
import { setupMocks, promiseOf } from "./setup";
import { FirebaseAppHostingServiceAccount } from "../components/firebase-apphosting-serviceaccount";

describe("FirebaseAppHostingServiceAccount component", () => {
    before(() => {
        setupMocks();
    });

    it("should provision custom service account and assign roles", async () => {
        const component = new FirebaseAppHostingServiceAccount("test-sa", {
            projectId: "test-project-id",
            gitopsCloudbuildSa: "cloudbuild@gitops-proj.iam.gserviceaccount.com",
        });

        const accountId = await promiseOf(component.firebaseAppHostingServiceAccount.accountId);
        const displayName = await promiseOf(component.firebaseAppHostingServiceAccount.displayName);
        const saProject = await promiseOf(component.firebaseAppHostingServiceAccount.project);

        expect(accountId).to.equal("sriyav-firebasehost-sa");
        expect(displayName).to.equal("Firebase App Hosting compute service account");
        expect(saProject).to.equal("test-project-id");

        const memberRole = await promiseOf(component.firebaseAppHostingServiceAccountIamMember.role);
        const memberProject = await promiseOf(component.firebaseAppHostingServiceAccountIamMember.project);
        expect(memberRole).to.equal("roles/owner");
        expect(memberProject).to.equal("test-project-id");

        const impersonationRole = await promiseOf(component.impersonationIamMember.role);
        const impersonationMember = await promiseOf(component.impersonationIamMember.member);
        expect(impersonationRole).to.equal("roles/iam.serviceAccountTokenCreator");
        expect(impersonationMember).to.equal("serviceAccount:cloudbuild@gitops-proj.iam.gserviceaccount.com");
    });
});
