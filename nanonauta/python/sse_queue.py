"""
sse_queue.py
Cola global compartida entre el hilo receptor LoRa (main.py)
y el endpoint SSE de Flask (backend/main.py).

Uso:
    from sse_queue import sse_queue
    sse_queue.put(json_string)   # en main.py
    item = sse_queue.get()       # en el generator SSE de Flask
"""
import queue

# maxsize=0 → ilimitada; en el Arduino Uno Q ponemos un tope
# para evitar que se llene si el browser se desconecta.
sse_queue: queue.Queue = queue.Queue(maxsize=200)
