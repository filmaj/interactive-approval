import { Manifest, DefineEvent, Schema, DefineType } from "deno-slack-sdk/mod.ts";
import ApprovalWorkflow from "./workflows/approval.ts";
import AnnoyWorkflow from "./workflows/annoy.ts";
/*
import RemoveWorkflow from "./workflows/remove-user.ts";
import PingPongWorkflow from "../deno-code-snippets/Event_Triggers/workflows/ping_pong_message.ts";
import CanvasWorkflow from "./workflows/canvas.ts";
*/
import LinkedInProvider from "./oauth/linkedin.ts";

export default Manifest({
  name: "interactive-disapproval",
  description: "Approving allthethings",
  icon: "icon.png",
  workflows: [ApprovalWorkflow , AnnoyWorkflow/*, RemoveWorkflow, PingPongWorkflow, CanvasWorkflow */],
  externalAuthProviders: [LinkedInProvider],
  outgoingDomains: ["raw.githubusercontent.com"],
  botScopes: ["commands", "chat:write", "chat:write.public", "metadata.message:read", "channels:history", "files:read", "usergroups:write", "reactions:read", "channels:read", "canvases:write", "canvases:read", "im:write", "groups:write", "triggers:write"],
  /*
  features: {
    appHome: {
      messagesTabEnabled: true,
      messagesTabReadOnlyEnabled: false,
    }
  }
  */
});
