import React from 'react';
import { User } from './types';
import CommunicationsView from './CommunicationsView';

interface EMessengerViewProps {
  currentUser: User;
}

export const EMessengerView: React.FC<EMessengerViewProps> = ({ currentUser }) => (
    <CommunicationsView currentUser={currentUser} forcedMode="MESSAGING" />
);

export default EMessengerView;
