export interface JklTransportController {
  handleJKLInput: (key: 'j' | 'k' | 'l') => void;
}

export function createJklTransportHandlers(input: {
  playerController: JklTransportController;
}) {
  return {
    playForward: () => input.playerController.handleJKLInput('l'),
    playBackward: () => input.playerController.handleJKLInput('j'),
    pausePlayback: () => input.playerController.handleJKLInput('k'),
  };
}
