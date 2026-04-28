//  ------------------
//  SETUP
//  ------------------
let state = "CLOSED"
let busy = false
let MOTOR_TIME = 5000
radio.setGroup(1)
//  ------------------
//  SEND LOCK (ANTI-SPAM)
//  ------------------
let last_send = 0
let SEND_COOLDOWN = 800
//  ms
//  ------------------
//  ICONS
//  ------------------
function show_locked() {
    basic.showLeds(`
        . # # # .
        # . . . #
        # # # # #
        # . . . #
        # # # # #
    `)
    basic.pause(200)
    basic.clearScreen()
}

function show_error() {
    basic.showIcon(IconNames.No)
    basic.pause(200)
    basic.clearScreen()
}

//  ------------------
//  SYNC STATE
//  ------------------
function send_state(s: string) {
    for (let i = 0; i < 3; i++) {
        radio.sendString("STATE:" + s)
        basic.pause(50)
    }
}

//  ------------------
//  OPEN
//  ------------------
function open_bridge(time: number) {
    
    if (busy || state != "CLOSED") {
        return
    }
    
    busy = true
    state = "OPENING"
    Kitronik_Robotics_Board.motorOn(Kitronik_Robotics_Board.Motors.Motor1, Kitronik_Robotics_Board.MotorDirection.Forward, 1023)
    basic.pause(time)
    Kitronik_Robotics_Board.motorOff(Kitronik_Robotics_Board.Motors.Motor1)
    state = "OPEN"
    busy = false
    send_state("OPEN")
}

//  ------------------
//  CLOSE
//  ------------------
function close_bridge(time: number) {
    
    if (busy || state != "OPEN") {
        return
    }
    
    busy = true
    state = "CLOSING"
    Kitronik_Robotics_Board.motorOn(Kitronik_Robotics_Board.Motors.Motor1, Kitronik_Robotics_Board.MotorDirection.Reverse, 1023)
    basic.pause(time)
    Kitronik_Robotics_Board.motorOff(Kitronik_Robotics_Board.Motors.Motor1)
    state = "CLOSED"
    busy = false
    send_state("CLOSED")
}

//  ------------------
//  BUTTONS (FIXED)
//  ------------------
input.onButtonPressed(Button.A, function on_button_pressed_a() {
    
    if (busy) {
        show_locked()
        return
    }
    
    if (control.millis() - last_send < SEND_COOLDOWN) {
        return
    }
    
    if (state == "OPEN") {
        show_error()
        return
    }
    
    last_send = control.millis()
    radio.sendValue("OPEN", MOTOR_TIME)
})
input.onButtonPressed(Button.B, function on_button_pressed_b() {
    
    if (busy) {
        show_locked()
        return
    }
    
    if (control.millis() - last_send < SEND_COOLDOWN) {
        return
    }
    
    if (state == "CLOSED") {
        show_error()
        return
    }
    
    last_send = control.millis()
    radio.sendValue("CLOSE", MOTOR_TIME)
})
input.onButtonPressed(Button.AB, function on_button_pressed_ab() {
    
    if (busy) {
        show_locked()
        return
    }
    
    MOTOR_TIME += 200
})
//  ------------------
//  LOGO LONG PRESS (DECREASE)
//  ------------------
let logo_start = 0
input.onLogoEvent(TouchButtonEvent.Pressed, function on_logo_down() {
    
    logo_start = control.millis()
})
input.onLogoEvent(TouchButtonEvent.Released, function on_logo_up() {
    
    let duration = control.millis() - logo_start
    if (duration > 500) {
        MOTOR_TIME -= 200
        if (MOTOR_TIME < 0) {
            MOTOR_TIME = 0
        }
        
    }
    
})
//  ------------------
//  RADIO
//  ------------------
radio.onReceivedValue(function on_received_value(name: string, value: number) {
    if (busy) {
        return
    }
    
    if (name == "OPEN") {
        open_bridge(value)
    } else if (name == "CLOSE") {
        close_bridge(value)
    }
    
})
//  ------------------
//  STATE SYNC
//  ------------------
radio.onReceivedString(function on_received_string(msg: string) {
    
    if (msg == "STATE:OPEN") {
        state = "OPEN"
    } else if (msg == "STATE:CLOSED") {
        state = "CLOSED"
    }
    
})
