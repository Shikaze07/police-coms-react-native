import React from 'react';
import { User } from './types';
import CommunicationsView from './CommunicationsView';

interface ERadioViewProps {
  currentUser: User;
}

export const ERadioView: React.FC<ERadioViewProps> = ({ currentUser }) => (
    <CommunicationsView currentUser={currentUser} forcedMode="RADIO" />
);

export default ERadioView;
