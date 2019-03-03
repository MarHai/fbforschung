# JSON Schemas for Plug-in-to-Server Communication

The browser plug-in repeatedly talks to a server. The server is a central instance which collects and maintains, maybe depicts or deletes, the observed data. It is thus dependent on a specific research-project's intentions, prerequisites, and uses. 

For the server communication to work neatlessly, though, a communication standard between the plug-in instances and the server needs to be established. The standard in use among this repository's plug-in is described here and it builds upon JSON. This is what this collection of JSON schemas is for.

[JSON Schema](https://json-schema.org/) is a collaborative and open-source approach toward a standard of a "vocabulary that allows you to annotate and validate JSON documents."  For validation of a given JSON document, check out its [implementations](https://json-schema.org/implementations.html).

## Server endpoints

The plug-in talks to various URL endpoints at the server. Based on their intention, they use different modes of HTTP communication. Building upon the main URL, this endpoints are the following.

1. `/register` (_POST_) listens to new plug-in registrations using the [register JSON schema](register.json). It checks whether the human identifier currently does not exist or, if it does, whether the provided password is identical. It responds following the [register-response JSON schema](register_response.json).
1. `/config` (_GET_) returns the latest config applying the [config-response JSON schema](config_response.json).
1. `/config/*version*` (e.g., `/config/1.12.4`, _GET_) checks whether the given config version is the latest configuration version available and responds following the [config-version-response JSON schema](configversion_response.json). 
1. `/config/dev` (_GET_) is the same as `/config` (thus following the same schema), but it checks for the latest configuration in development stage (for testing purposes).
1. Similarly, `/config/dev/*version*` (_GET_) does the same as `/config/*version*` but for the latest development version as well.
1. `/message` (_GET_ and _POST_) returns the messages to be shown to the user, following the [message-response JSON schema](message_response.json). If addressed via _POST_, the [message JSON schema](message.json) allows to include indications that a user has been shown, has read, or has clicked the message.
1. `/message/email` (_POST_) allows to send a specified message as depicted in the [messageemail JSON schema](emailmessage.json) to a given email address. The [messageemail-response JSON schema](emailmessage_response.json) then specifies the answer.
1. `/posts` (_POST_) allows to create new sessions to add posts, following the [posts JSON schema](posts.json). The response is rather simplistic, following the [posts-response JSON schema](posts_response.json).
1. `/interaction` (_POST_) adds a new interaction to a session's post, thereby applying the [interaction JSON schema](interaction.json), expecting a similarly simplistic [interaction-response JSON schema](interaction_response.json).

## Authentication

The plug-in's current version uses a hash-based header authentication. That is, for every call, it includes the following headers for validation:
- `X-Auth-Key` is set to a random nonce string
- `X-Auth-Checksum` uses a HMAC (SHA1) sum, encrypted with the currently logged-in user's password's hash as pass phrase (the registration endpoint does not require this validation). The data of which the checksum is calculated depicts a concatenated string of the following three elements: 
    1. the complete URL/endpoint
    1. the (json-stringified) body
    1. the random nonce string as specified in `X-Auth-Key`
- `X-Auth-Plugin` holds the integer UID of the currently registered plug-in
- `Content-Type` is set to `application/json`
