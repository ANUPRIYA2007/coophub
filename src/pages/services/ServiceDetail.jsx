import { useParams } from 'react-router-dom';

export default function ServiceDetail() {
    const { id } = useParams();
    return (
        <div className="page-container py-8">
            <h1 className="text-3xl font-display font-bold text-gray-900">Service Detail</h1>
            <p className="text-gray-500 mt-2">Service ID: {id}</p>
            {/* Service detail will be implemented here */}
        </div>
    );
}
