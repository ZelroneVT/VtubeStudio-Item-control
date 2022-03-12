import React, { useState, useEffect } from "react";

const IntervalChecker = ({ triggerFn, sendMessage }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      sendMessage(`{
          "apiName": "VTubeStudioPublicAPI",
          "apiVersion": "1.0",
          "requestID": "MyIDWithLessThan64Characters",
          "messageType": "APIStateRequest"
      }`);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return <div>Checking....</div>;
};

export default IntervalChecker;
