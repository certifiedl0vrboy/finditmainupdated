import { useState, useRef, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TermsOfServiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAccept: () => void;
}

const TermsOfServiceDialog = ({
    open,
    onOpenChange,
    onAccept,
}: TermsOfServiceDialogProps) => {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [prevOpen, setPrevOpen] = useState(open);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Reset scroll-acceptance state when the dialog transitions to open.
    // This runs during render (not inside a useEffect) per React's own
    // guidance for "adjusting state when a prop changes" — it avoids the
    // extra render pass a synchronous setState-in-effect would cause.
    if (open !== prevOpen) {
        setPrevOpen(open);
        if (open) {
            setHasScrolledToBottom(false);
        }
    }

    // Side effect: once the dialog has painted, check whether the content
    // already fits on screen without scrolling (e.g. a tall viewport) and,
    // if so, auto-satisfy the "scrolled to bottom" requirement. The setState
    // call here happens inside the setTimeout callback — i.e. in response to
    // an actual DOM measurement after paint — rather than synchronously in
    // the effect body.
    useEffect(() => {
        if (!open) return;
        const timeout = setTimeout(() => {
            if (scrollRef.current) {
                const { scrollHeight, clientHeight } = scrollRef.current;
                if (scrollHeight <= clientHeight) {
                    setHasScrolledToBottom(true);
                }
            }
        }, 100);
        return () => clearTimeout(timeout);
    }, [open]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            // Add a small buffer (e.g., 10px) to account for rounding errors across browsers
            if (scrollTop + clientHeight >= scrollHeight - 10) {
                setHasScrolledToBottom(true);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col font-sans">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif font-bold text-primary-blue">
                        Terms of Service
                    </DialogTitle>
                    <DialogDescription>
                        Please read and scroll to the bottom to accept our terms.
                    </DialogDescription>
                </DialogHeader>

                {/* Custom scroll view instead of ScrollArea to cleanly attach native onScroll */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 pr-4 -mr-4 overflow-y-auto custom-scrollbar"
                >
                    <div className="space-y-4 text-sm text-mocha/80 leading-relaxed pb-6">
                        <p>
                            <strong>Last Updated: February 20, 2026</strong>
                        </p>
                        <p>
                            Welcome to FINDIT. By accessing or using our platform, you agree to
                            be bound by these Terms of Service.
                        </p>

                        <h3 className="font-bold text-primary-blue mt-4">
                            1. Acceptance of Terms
                        </h3>
                        <p>
                            By registering for an account or using our services, you agree to
                            these terms. If you do not agree, do not use our services.
                        </p>

                        <h3 className="font-bold text-primary-blue mt-4">
                            2. User Accounts
                        </h3>
                        <p>
                            You are responsible for maintaining the confidentiality of your
                            account and password. You agree to accept responsibility for all
                            activities that occur under your account.
                        </p>

                        <h3 className="font-bold text-primary-blue mt-4">
                            3. Service Providers
                        </h3>
                        <p>
                            Service providers verify that they are qualified to perform the
                            services they list. FINDIT is a platform for connecting users and
                            does not directly provide these services.
                        </p>

                        <h3 className="font-bold text-primary-blue mt-4">
                            4. User Conduct
                        </h3>
                        <p>
                            You agree not to use the platform for any unlawful purpose or in any
                            way that interrupts, damages, or impairs the service.
                        </p>

                        <h3 className="font-bold text-primary-blue mt-4">
                            5. Location Services
                        </h3>
                        <p>
                            By using FINDIT, you consent to the collection and use of your precise
                            geographic location. This data is essential for customers to find your
                            business and for us to provide accurate mapping and distance calculations.
                        </p>

                        <h3 className="font-bold text-primary-blue mt-4">
                            6. Privacy
                        </h3>
                        <p>
                            Your use of the platform is also governed by our Privacy Policy.
                        </p>

                        <h3 className="font-bold text-primary-blue mt-4">
                            7. Termination
                        </h3>
                        <p>
                            We reserve the right to terminate or suspend your account at our
                            sole discretion, without notice, for conduct that we believe
                            violates these Terms or is harmful to other users, us, or third
                            parties, or for any other reason.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-mocha/20 text-mocha hover:bg-mocha/5"
                    >
                        Decline
                    </Button>
                    <Button
                        onClick={() => {
                            onAccept();
                            onOpenChange(false);
                        }}
                        disabled={!hasScrolledToBottom}
                        className="bg-primary-blue text-white hover:bg-primary-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {hasScrolledToBottom ? "I Accept" : "Scroll to bottom"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TermsOfServiceDialog;
