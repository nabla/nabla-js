# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Handle a new type of message: "QuestionsSetForm". Those are sets of questions sent by a Provider to a Patient that the Patient can answer by going to a specific URL.

## [1.0-alpha02] - 2023-04-06

### Added

- The SDK is now compatible with the conversation locking feature.
- Added new `lastMessage` property on `Conversation` that gives access to the whole message and not just its preview.

## [1.0-alpha01] - 2023-03-17

### Added

- First public version of the SDK
