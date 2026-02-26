import React from 'react';
import { Card, Button } from '@sdkwork/react-commons';

const PricingPage: React.FC = () => {
    return (
        <div className="pricing-page">
            <h1>Pricing</h1>
            <Card>
                <h2>Free Plan</h2>
                <p>$0/month</p>
                <Button>Get Started</Button>
            </Card>
            <Card>
                <h2>Pro Plan</h2>
                <p>$29/month</p>
                <Button>Upgrade</Button>
            </Card>
        </div>
    );
};

export { PricingPage };
