# ------------------
# SETUP
# ------------------
state = "CLOSED"
busy = False
MOTOR_TIME = 5000

radio.set_group(1)

# ------------------
# SEND LOCK (ANTI-SPAM)
# ------------------
last_send = 0
SEND_COOLDOWN = 800  # ms

# ------------------
# ICONS
# ------------------
def show_locked():
    basic.show_leds("""
        . # # # .
        # . . . #
        # # # # #
        # . . . #
        # # # # #
    """)
    basic.pause(200)
    basic.clear_screen()

def show_error():
    basic.show_icon(IconNames.NO)
    basic.pause(200)
    basic.clear_screen()

# ------------------
# SYNC STATE
# ------------------
def send_state(s):
    for i in range(3):
        radio.send_string("STATE:" + s)
        basic.pause(50)

# ------------------
# OPEN
# ------------------
def open_bridge(time):
    global state, busy

    if busy or state != "CLOSED":
        return

    busy = True
    state = "OPENING"

    Kitronik_Robotics_Board.motor_on(
        Kitronik_Robotics_Board.Motors.MOTOR1,
        Kitronik_Robotics_Board.MotorDirection.FORWARD,
        1023
    )

    basic.pause(time)

    Kitronik_Robotics_Board.motor_off(
        Kitronik_Robotics_Board.Motors.MOTOR1
    )

    state = "OPEN"
    busy = False

    send_state("OPEN")

# ------------------
# CLOSE
# ------------------
def close_bridge(time):
    global state, busy

    if busy or state != "OPEN":
        return

    busy = True
    state = "CLOSING"

    Kitronik_Robotics_Board.motor_on(
        Kitronik_Robotics_Board.Motors.MOTOR1,
        Kitronik_Robotics_Board.MotorDirection.REVERSE,
        1023
    )

    basic.pause(time)

    Kitronik_Robotics_Board.motor_off(
        Kitronik_Robotics_Board.Motors.MOTOR1
    )

    state = "CLOSED"
    busy = False

    send_state("CLOSED")

# ------------------
# BUTTONS (FIXED)
# ------------------
def on_button_pressed_a():
    global last_send

    if busy:
        show_locked()
        return

    if control.millis() - last_send < SEND_COOLDOWN:
        return

    if state == "OPEN":
        show_error()
        return

    last_send = control.millis()
    radio.send_value("OPEN", MOTOR_TIME)

input.on_button_pressed(Button.A, on_button_pressed_a)


def on_button_pressed_b():
    global last_send

    if busy:
        show_locked()
        return

    if control.millis() - last_send < SEND_COOLDOWN:
        return

    if state == "CLOSED":
        show_error()
        return

    last_send = control.millis()
    radio.send_value("CLOSE", MOTOR_TIME)

input.on_button_pressed(Button.B, on_button_pressed_b)


def on_button_pressed_ab():
    global MOTOR_TIME
    if busy:
        show_locked()
        return
    MOTOR_TIME += 200

input.on_button_pressed(Button.AB, on_button_pressed_ab)

# ------------------
# LOGO LONG PRESS (DECREASE)
# ------------------
logo_start = 0

def on_logo_down():
    global logo_start
    logo_start = control.millis()

input.on_logo_event(TouchButtonEvent.PRESSED, on_logo_down)


def on_logo_up():
    global MOTOR_TIME
    duration = control.millis() - logo_start

    if duration > 500:
        MOTOR_TIME -= 200
        if MOTOR_TIME < 0:
            MOTOR_TIME = 0

input.on_logo_event(TouchButtonEvent.RELEASED, on_logo_up)

# ------------------
# RADIO
# ------------------
def on_received_value(name, value):
    if busy:
        return

    if name == "OPEN":
        open_bridge(value)

    elif name == "CLOSE":
        close_bridge(value)

radio.on_received_value(on_received_value)

# ------------------
# STATE SYNC
# ------------------
def on_received_string(msg):
    global state

    if msg == "STATE:OPEN":
        state = "OPEN"

    elif msg == "STATE:CLOSED":
        state = "CLOSED"

radio.on_received_string(on_received_string)
