import { Button } from "@/components/ui/button";
import { Crosshair, Hand } from "lucide-react";

interface StartMenuProps {
  onStart: () => void;
}

export default function StartMenu({ onStart }: StartMenuProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md p-8 space-y-8 bg-card border border-border rounded-xl shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter text-primary">Cam Shooter</h1>
          <p className="text-muted-foreground">Get ready to test your aim!</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
            <Hand className="w-8 h-8 mt-1 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold">Gun Gesture</h3>
              <p className="text-sm text-muted-foreground">
                Form a "gun" with your hand (thumb up, index finger forward) to aim.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
            <Crosshair className="w-8 h-8 mt-1 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold">Shoot</h3>
              <p className="text-sm text-muted-foreground">
                Flick your thumb down ("Bang!" motion) to fire a shot.
              </p>
            </div>
          </div>
        </div>

        <Button 
          size="lg" 
          className="w-full text-lg font-semibold transition-all hover:scale-105"
          onClick={onStart}
        >
          Start Game
        </Button>
      </div>
    </div>
  );
}
