# Twine 2 Chat

## Built with
- Express
- Botkit

## How it works
This tool uses Express and Botkit to deploy a bot server that communicates with Telegram messaging. Visiting the root path allows you to upload a Twine HTML file which will "train" the bot with story dialog. Once trained, you can interact with the bot through Telegram and navigate the story based on your responses to the bot.

## Twine file
### Assumptions
- Each node name starts with a scene label/ID
### Manual edit to Twine project
- Normalize responses/variables
  - yes
  - no
  - no response
  - {VARIABLE_NAME}
### Future Improvements
- Would be better to set scene labels (e.g. 1.3A) as tags rather than the title
- NLU for better intents using DialogFlow, Wit, Watson, etc.
- Timing logic for "no response"
- Check length of message text to determine if it's short or long


## Initial planning

### Logic Flow
createExperience(TwineProject)
  - Parse TwineProject into JSON graph
  - Store graph in database
  - Store experience state in database (marked as "active")
    - fields
      - graph id
      - scene metrics
        - post datetime
        - number of interactions (after scene posted but before next scene posted)
      - most recent scene

taskManager()
  - (every 5 min) for each active experience
    - syncExperienceState(id)
    - check most recent scene state
      - if conditionals met, publish next scene
        - trainChatbot(scene)
      - syncExperienceState(id)

syncExperienceState()
  - get "live" experience state
    - use social media API to retrieve last post
    - use chat API to retrieve # of interactions
  - update experience state in database
    - if experience is finished, mark "inactive"

trainChatbot(RootScene)
  - train chatbot for dialog following RootScene

### Ideas
- Add conditionals to scenes
  - publish datetime
  - Number of interactions (interaction == interaction since current scene post)
  - Min time since post
  - Max time since post (required)

### Notes
  - Message platform
    - Facebook messenger (via fan page)
    - Telegram
      - Does not require phone #, or business/fan page
    - Discord
    - WhatsApp
  - NLP/chatbot
    - PandoraBot
      - Generate AIML
    - DialogFlow (closed source)
      - Set intents, context, etc.
      - useful
        - @sys.given-name
        - Linear dialog
          - Mark entities as "required" to get user to tell you needed info (slot filling)
          - Only useful if trying to retrieve specific data from the user
        - Non-linear
        - followup-intents
    - Rasa (open-source, python-based)
    - Botkit/Botframework (open-source, owned by Microsoft)
      - Why?
        - open-source, can be self-hosted
        - part of the Microsoft bot framework which includes many other features and integrations
        - Has multiple conversation models, including dialog control that fits well with the Twine model
        - Can plugin to other NLP/NLU platforms
    - Botpress (open-source)
  
### Arch
  - Express server
    - GET HTML page with submit form
    - POST Twine project file
    - Messaging Webhooks

## References
- https://www.watershed.co.uk/studio/projects/tendencyto-spill-using-chatbot-storytelling-platform
- https://www.wordstream.com/blog/ws/2017/10/04/chatbots


## Develop
### Install
`yarn install`

### Run
`yarn dev`

### Build & Deploy
`yarn build && yarn deploy`

