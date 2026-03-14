import React from 'react';
import { SubjectReferenceSection } from '../../modes';
import type { VideoModeTabContentProps } from '../types';

type SubjectRefTabPanelProps = Pick<VideoModeTabContentProps, 'config' | 'onSubjectReferenceChange'>;

export const SubjectRefTabPanel: React.FC<SubjectRefTabPanelProps> = ({
    config,
    onSubjectReferenceChange
}) => {
    return (
        <SubjectReferenceSection
            value={config.image}
            onChange={onSubjectReferenceChange}
        />
    );
};
