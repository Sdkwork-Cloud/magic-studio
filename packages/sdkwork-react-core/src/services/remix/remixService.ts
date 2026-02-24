
import { RemixIntent } from './remix.entity';

class RemixService {
    private pendingIntent: RemixIntent | null = null;

    /**
     * Stash an intent before navigating to a Studio page.
     */
    public setIntent(intent: RemixIntent) {
        console.log('[RemixService] Stashing intent:', intent);
        this.pendingIntent = intent;
    }

    /**
     * Retrieve and clear the pending intent.
     * Called by Studio Stores on initialization.
     */
    public consumeIntent(targetModule?: string): RemixIntent | null {
        if (!this.pendingIntent) return null;
        
        // Safety check to ensure we don't load a Video intent into Music studio etc.
        if (targetModule && this.pendingIntent.targetModule !== targetModule) {
            return null;
        }

        const intent = this.pendingIntent;
        this.pendingIntent = null; // Clear after consumption
        return intent;
    }

    /**
     * Check if there is a pending intent without consuming it.
     */
    public hasPendingIntent(): boolean {
        return !!this.pendingIntent;
    }
}

export const remixService = new RemixService();
