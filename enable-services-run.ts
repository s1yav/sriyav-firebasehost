import { EnableService } from "./enable-service";
import { gcpConfig } from "./configuration";

const projectId = gcpConfig.require("project");

export const services = new EnableService("sriyav-services", {
    projectId: projectId,
});
