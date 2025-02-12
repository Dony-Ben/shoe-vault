// sseServer.js

let clients = [];

// SSE endpoint to handle connections and broadcast messages
function setupSSE(app) {
    // Endpoint to send real-time updates
    app.get('/events', (req, res) => {
        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Generate a unique client ID (e.g., using timestamp)
        const clientId = Date.now(); 
        const clientData = { clientId, res };

        // Add the client to the clients array
        clients.push(clientData);

        // Send a welcome message when the client connects
        res.write(`data: Connected to SSE\n\n`);

        // Cleanup on client disconnect
        req.on('close', () => {
            console.log(`Client ${clientId} disconnected`);
            clients = clients.filter(client => client.clientId !== clientId); // Remove disconnected client
            res.end();
        });
    });
}

// Function to notify a specific client
function notifyClient(clientId, message) {
    const client = clients.find(client => client.clientId === clientId);
    if (client) {
        client.res.write(`data: ${message}\n\n`);
        console.log(`Notified client ${clientId} with message: ${message}`);
    } else {
        console.log(`Client ${clientId} not found`);
    }
}

// Function to notify all connected clients
function notifyAllClients(message) {
    clients.forEach(client => {
        client.res.write(`data: ${message}\n\n`);
    });
    console.log(`Notified all clients with message: ${message}`);
}

module.exports = { setupSSE, notifyClient, notifyAllClients };
