import { Manifest, DefineEvent, Schema, DefineType } from "deno-slack-sdk/mod.ts";
import ApprovalWorkflow from "./workflows/approval.ts";

const fancyAssBoolean = DefineType({
  name: "fancyAssBoolean",
  type: Schema.types.object,
  properties: {
    aBoolean: { type: "boolean" },
  },
});

export const MyEvent = DefineEvent({
  name: "my_event",
  type: fancyAssBoolean,
  // required: ["aBoolean"],
});

export default Manifest({
  name: "interactive-disapproval",
  description: "Approving allthethings",
  icon: "icon.png",
  workflows: [ApprovalWorkflow],
  outgoingDomains: ["raw.githubusercontent.com"],
  botScopes: ["commands", "chat:write", "chat:write.public", "metadata.message:read", "channels:history"],
  events: [MyEvent],
});
