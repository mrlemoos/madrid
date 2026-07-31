# Editor

The TipTap/ProseMirror rich-text editor for note bodies, shared by the app and
the read-only shared-note page. Terms below are specific to editor features, not
general ProseMirror concepts.

## Language

**Flight code**:
An IATA airline code plus flight number (`AA123`), detected inline in a note when
its 2-char prefix is a known airline. Detection is passive — it decorates text,
never mutates the document.
_Avoid_: flight number, flight ID

**Flight card**:
The hover popover over a flight code showing a small flat map (live position) or,
when the plane isn't up yet, its schedule.
_Avoid_: tooltip, preview

**Flight globe**:
The large draggable orthographic globe in the click-through dialog for a flight
code. Same data as the flight card, bigger view.

**Airborne**:
State where AirLabs returns a live position for the flight. When not airborne, the
card/globe show the schedule (route + times) with no plane marker.
_Avoid_: in-flight, active
