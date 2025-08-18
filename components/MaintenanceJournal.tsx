
import React from 'react';
import MaintenanceForm from './MaintenanceForm';
import MaintenanceList from './MaintenanceList';
import Card from './Card';

const MaintenanceJournal: React.FC = () => {
    return (
        <div className="space-y-8">
            <MaintenanceForm />
            <Card>
                <MaintenanceList />
            </Card>
        </div>
    );
};

export default MaintenanceJournal;
