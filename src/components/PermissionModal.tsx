import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

interface PermissionModalProps {
    onRequestPermission: () => void;
}

export default function PermissionModal({ onRequestPermission }: PermissionModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-md p-8 space-y-6 text-center bg-card border border-border rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-500">
                <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-primary/10">
                        <Camera className="w-12 h-12 text-primary" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Camera Access Required</h2>
                    <p className="text-muted-foreground">
                        This game requires camera access to track your hand movements.
                        The video feed is processed locally on your device and is never sent to any server.
                    </p>
                </div>

                <Button
                    size="lg"
                    className="w-full"
                    onClick={onRequestPermission}
                >
                    Allow Camera Access
                </Button>
            </div>
        </div>
    );
}
