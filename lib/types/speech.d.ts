interface Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}
