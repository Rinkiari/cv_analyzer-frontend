import { Progress } from '@chakra-ui/react';

export default function ProgressBar({ step, maxSteps = 5 }) {
  const percent = (step / maxSteps) * 100;

  return (
    <Progress.Root value={percent} max={100} maxW="1041px">
      <Progress.Track bg="black" borderRadius="6px" h="4px" overflow="hidden">
        <Progress.Range bg="yellow.400" transition="width 350ms ease" />
      </Progress.Track>
    </Progress.Root>
  );
}
