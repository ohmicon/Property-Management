# Socket.IO Configuration Guide

## Environment Variables

You can set these environment variables to customize Socket.IO behavior:

### SOCKET_PORT
- **Default**: 8080
- **Description**: Starting port for Socket.IO server
- **Example**: `SOCKET_PORT=9000`

## Port Strategy

The system will try to find an available port using this strategy:

1. **Sequential Search**: Start from `SOCKET_PORT` (default 8080) and try up to 50 consecutive ports
2. **Random Port Fallback**: If sequential search fails, try a random available port
3. **Graceful Failure**: If all attempts fail, show clear error message

## Development Mode Features

- **Hot Reload Cleanup**: Automatically cleans up old Socket.IO instances during development
- **Process Handlers**: Handles SIGTERM, SIGINT, and uncaught exceptions
- **Memory Cleanup**: Clears temporary bookings and socket tracking on shutdown

## Production Recommendations

1. **Set Fixed Port**: Use `SOCKET_PORT` environment variable in production
2. **Load Balancer**: Configure load balancer to route Socket.IO traffic properly
3. **Health Checks**: Monitor Socket.IO server health and restart if needed
4. **Resource Limits**: Set appropriate memory and CPU limits

## Troubleshooting

### Port Conflicts
- Check what's using ports: `netstat -tulpn | grep :8080`
- Kill processes: `sudo kill -9 <PID>`
- Use different port: `SOCKET_PORT=9000 npm run dev`

### Memory Leaks
- Monitor with: `ps aux | grep node`
- Check memory usage: `top -p <PID>`
- Restart if memory usage is high

### Connection Issues
- Check firewall settings
- Verify CORS configuration
- Test with different browsers
