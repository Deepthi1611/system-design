# Short Polling

Short polling is a client-server communication pattern where the client asks the server for data at a fixed interval.

The server does not keep the request open. It immediately responds with whatever data it currently has, even if nothing has changed since the previous request.

## How it works

1. The browser sends a request to the server.
2. The server immediately returns the current data.
3. The browser waits for a fixed amount of time.
4. The browser sends the same request again.
5. This repeats until the page is closed or polling is stopped.

In this example, the browser polls every 5 seconds:

```js
const pollingInterval = 5000;

fetchData();
setInterval(fetchData, pollingInterval);
```

## Example flow

The page calls:

```txt
GET /data
```

The server returns the current message:

```json
{
  "message": "Hello, this is the Initial data you requested!"
}
```

The browser displays the message and updates the last fetched time.

After 5 seconds, the browser calls `/data` again, even if the server data has not changed.

## Updating data

The UI has an **Update Server Data** button.

When clicked, the browser calls:

```txt
GET /update-data
```

The server updates the message with the current timestamp. The next polling request then receives the updated value.

## What you see in the Network tab

With short polling, requests appear continuously at fixed intervals.

For this example, you should see one `/data` request about every 5 seconds. This is expected behavior for short polling.

## Advantages

- Simple to understand and implement.
- Works with normal HTTP requests.
- Easy to debug in the browser Network tab.

## Disadvantages

- Sends requests even when nothing has changed.
- Can waste server resources and network bandwidth.
- Updates are not instant; they are only discovered on the next polling interval.

## When to use

Short polling is useful when:

- The data does not change very often.
- Real-time updates are not required.
- Simplicity is more important than efficiency.

Examples include status pages, simple dashboards, and background job progress checks where a few seconds of delay is acceptable.
