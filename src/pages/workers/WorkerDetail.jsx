import { useParams } from 'react-router-dom';

export default function WorkerDetail() {
    const { id } = useParams();
    return (
        <div className="page-container py-8">
            <h1 className="text-3xl font-display font-bold text-gray-900">Worker Detail</h1>
            <p className="text-gray-500 mt-2">Worker ID: {id}</p>
            {/* Worker detail will be implemented here */}
        </div>
    );
}
