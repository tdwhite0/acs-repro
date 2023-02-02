import { Call, CallClient, LocalAudioStream } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import { CommunicationIdentityClient } from "@azure/communication-identity";
import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const App = () => {
  const [acsConnectionString, setAcsConnectionString] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [call, setCall] = useState<Call>();
  const [callIsConnected, setCallIsConnected] = useState(false);

  const getACSToken = async () => {
    const identityClient = new CommunicationIdentityClient(acsConnectionString);
    let identityResponse = await identityClient.createUserAndToken(["voip", "chat"]);
    return identityResponse;
  };

  const createBeepAudioStreamToSend = () => {
    const context = new AudioContext();
    const dest = context.createMediaStreamDestination();
    const os = context.createOscillator();
    os.type = "sine";
    os.frequency.value = 500;
    os.connect(dest);
    os.start();
    const { stream } = dest;
    return stream;
  };

  const createBeepAudioTracksOldWay = () => {
    const context = new AudioContext();
    const dest = context.createMediaStreamDestination();
    const os = context.createOscillator();
    os.type = "sine";
    os.frequency.value = 500;
    os.connect(dest);
    os.start();
    const tracks = dest.stream.getAudioTracks();
    return tracks;
  };

  return (
    <div>
      <input
        type="text"
        value={acsConnectionString}
        onChange={(e) => {
          setAcsConnectionString(e.target.value);
        }}></input>
      <br />
      <input
        type="text"
        value={joinUrl}
        onChange={(e) => {
          setJoinUrl(e.target.value);
        }}></input>

      <br />
      <button
        onClick={async () => {
          if (!acsConnectionString) {
            alert("please enter a connection string");
            return;
          }

          if (!joinUrl) {
            alert("please enter a Teams meeting join url");
            return;
          }
          let identity = await getACSToken();

          const callClient = new CallClient();
          const tokenCredential = new AzureCommunicationTokenCredential(identity.token);
          let callAgent = await callClient.createCallAgent(tokenCredential, { displayName: "ACS Test" });

          let call = callAgent.join(
            {
              meetingLink: joinUrl,
            },
            {
              videoOptions: {},
              audioOptions: {},
            }
          );

          setCall(call);

          const callStateChangedHandler = () => {
            if (call.state === "Connected") {
              setCallIsConnected(true);
            }
          };

          callStateChangedHandler();
          call.on("stateChanged", callStateChangedHandler);
        }}>
        Connect Call
      </button>
      {callIsConnected && (
        <div>
          <button
            onClick={() => {
              if (!call) return;

              const tracks = createBeepAudioTracksOldWay();
              const localAudioStream = new LocalAudioStream(tracks[0]);
              call.startAudio(localAudioStream);
            }}>
            Send Beep 1.9.1
          </button>

          <button
            onClick={() => {
              if (!call) return;

              const stream = createBeepAudioStreamToSend();
              const localAudioStream = new LocalAudioStream(stream);
              call.startAudio(localAudioStream);
            }}>
            Send Beep 1.10
          </button>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById("app");
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<App />);
