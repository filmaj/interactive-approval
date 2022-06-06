# Platform 2.0 Interactive Function Example

This app includes a single `approval` function that is meant as an example of how we can implement an app with function-specific interactivity handlers, i.e. `block_actions` and `view_submission` handlers. The function sends a message with a button, opens a modal on click, and handles the view submission by completing the function on submission, and outputting some approval related details.

This requires a custom version of `deno-slack-runtime` that routes `block_actions` and `view_submission` payloads accordingly.