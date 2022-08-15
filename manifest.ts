import { Manifest } from "deno-slack-sdk/mod.ts";
import { ApprovalWorkflow } from "./workflows/approval.ts";

export default Manifest({
  name: "interactive-approval",
  description: "Approving allthethings",
  icon: "assets/icon.png",
  workflows: [ApprovalWorkflow],
  outgoingDomains: [],
  botScopes: ["commands", "chat:write", "chat:write.public"],
});
