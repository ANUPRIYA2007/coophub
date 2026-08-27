import { useParams } from 'react-router-dom';

export default function Chat() {
    const { id } = useParams();
    return (
        <div className="page-container py-8">
            <h1 className="text-3xl font-display font-bold text-gray-900">Chat</h1>
            <p className="text-gray-500 mt-2">Chat Room: {id}</p>
            {/* Chat interface will be implemented here */}
        </div>
    );
}
