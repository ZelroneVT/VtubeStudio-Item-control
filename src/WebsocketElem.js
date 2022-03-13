import React, { useState, useCallback, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { WebSocketBus } from "vtubestudio";
import { ApiClient } from "vtubestudio";
import { Plugin } from "vtubestudio";
import { VTS_REQUESTS } from "./constants";
import IntervalChecker from "./IntervalChecker";

const WebsocketElem = () => {
  const [socketUrl, setSocketUrl] = useState("ws://localhost:8001");
  const [messageHistory, setMessageHistory] = useState([]);
  const [showTimer, setShowTimer] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const [hotKeyToggles, setHotKeyToggles] = useState([]);

  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    onMessage: (data) => {
      console.log("brrrr", data);
    },
  });

  useEffect(() => {
    console.log("lsm", lastMessage);
    if (lastMessage !== null) {
      setMessageHistory([...messageHistory, lastMessage]);
    }
  }, [lastMessage, setMessageHistory]);

  const handleClickChangeSocketUrl = useCallback(
    () => setSocketUrl("ws://localhost:8001"),
    []
  );

  const handleClickSendMessage = useCallback(() => sendMessage("Hello"), []);

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  useEffect(() => {
    console.log("message history", messageHistory);
    const lastMessage = messageHistory[messageHistory.length - 1];
    console.log("ASdad", lastMessage);
    if (lastMessage) {
      const parsedData = JSON.parse(lastMessage.data);
      console.log(parsedData);
      if (parsedData.messageType === "AuthenticationTokenResponse") {
        console.log("Eyoooo");
        setShowTimer(false);
        console.log(parsedData.data.authenticationToken);
        setAuthToken(parsedData.data.authenticationToken);
      } else if (parsedData.messageType === "AuthenticationResponse") {
        console.log("authenticated for the session");
        sendMessage(`{
          "apiName": "VTubeStudioPublicAPI",
          "apiVersion": "1.0",
          "requestID": "SomeID",
          "messageType": "AvailableModelsRequest"
        }`);
      } else if (parsedData.messageType === "AvailableModelsResponse") {
        console.log("Yeah we got responses!");
        sendMessage(`{
          "apiName": "VTubeStudioPublicAPI",
          "apiVersion": "1.0",
          "requestID": "SomeID",
          "messageType": "HotkeysInCurrentModelRequest"
         
      }`);
      } else if (parsedData.messageType === "HotkeysInCurrentModelResponse") {
        console.log("True Data", parsedData.data.availableHotkeys);
        setHotKeyToggles(parsedData.data.availableHotkeys);
      } else if (parsedData.messageType === "HotkeyTriggerResponse") {
        console.log("derp We have Triggred a hotkey", parsedData);
      }
    }
  }, [messageHistory.length]);

  useEffect(() => {
    if (connectionStatus === "Open") {
      console.log("open yeah");
      sendMessage(`{
	"apiName": "VTubeStudioPublicAPI",
	"apiVersion": "1.0",
	"requestID": "SomeID",
	"messageType": "AuthenticationTokenRequest",
	"data": {
		"pluginName": "My Cool Plugin",
		"pluginDeveloper": "My Name",
		"pluginIcon": null
	}
}`);
    }
  }, [connectionStatus]);

  useEffect(() => {
    console.log("we have auth token ", authToken);
    sendMessage(`{
        "apiName": "VTubeStudioPublicAPI",
        "apiVersion": "1.0",
        "requestID": "SomeID",
        "messageType": "AuthenticationRequest",
        "data": {
            "pluginName": "My Cool Plugin",
            "pluginDeveloper": "My Name",
            "authenticationToken": "${authToken}"
        }
    }`);
  }, [authToken]);

  const togglePats = () => {
    console.log("triggered");
    console.log(hotKeyToggles, hotKeyToggles[0].hotkeyID, hotKeyToggles.length);
    if (hotKeyToggles.length >= 0) {
      console.log("mesasgesend");
      sendMessage(`{
        "apiName": "VTubeStudioPublicAPI",
        "apiVersion": "1.0",
        "requestID": "SomeID",
        "messageType": "HotkeyTriggerRequest",
        "data": {
          "hotkeyID": "${hotKeyToggles[0].hotkeyID}"
        }
      }`);
    }
  };
  return (
    <div>
      WebsocketElem
      {showTimer && (
        <IntervalChecker sendMessage={sendMessage} triggerFn={() => {}} />
      )}
      <button onClick={togglePats}> Toggle Headpats</button>
    </div>
  );
};

async function getData() {
  const test = new Promise((resolve, reject) => {
    let wsClient = new WebSocket("ws://localhost:8001");
    wsClient.addEventListener("message", function (event) {
      console.log("Message from server ", event.data);
    });
    console.log("derp", wsClient);
    wsClient.onopen = () => {
      console.log("connected");
      console.log("sent");
      resolve(wsClient);
    };
    wsClient.onerror = (error) => reject(error);
  });
  test
    .then((webSocket) => {
      new Promise((resolve, reject) => {
        const bus = new WebSocketBus(webSocket);
        console.log("bus", bus);
        const apiClient = new ApiClient(bus);
        webSocket.send(`{
            "apiName": "VTubeStudioPublicAPI",
            "apiVersion": "1.0",
            "requestID": "SomeID",
            "messageType": "AuthenticationTokenRequest",
            "data": {
              "pluginName": "My Cool Plugin",
              "pluginDeveloper": "My Name",
              "pluginIcon": null
            }
          }`);

        console.log("web socket ", webSocket);

        console.log(webSocket);
        console.log("VTube Studio verison:", apiClient);
        const plugin = new Plugin(apiClient, "asdasdasd", "dasdasd");

        console.log("plugin", plugin);
        console.log(plugin.apiClient.vtsFolderInfo());
        console.log("VTube Studio verison:", apiClient.availableModels());
        const stats = apiClient.statistics();

        resolve(stats);
      });
    })
    .catch((e) => {
      console.log("oops", e);
    });
}
export default WebsocketElem;
