print("starting")
import board
from storage import getmount
from kmk.kmk_keyboard import KMKKeyboard
from kmk.keys import KC
from kmk.consts import UnicodeMode
from kmk.scanners import DiodeOrientation
from kmk.modules.split import Split, SplitSide
from kmk.modules.layers import Layers
from kmk.modules.holdtap import HoldTap
from kmk.handlers.sequences import simple_key_sequence, unicode_codepoint_sequence, send_string, unicode_string_sequence
print("imports done")

holdtap = HoldTap()
holdtap.tap_time = 300
split = Split(
    uart_flip=False,
    data_pin=board.GP13,
    data_pin2=board.GP12,
    use_pio=True
)

keyboard = KMKKeyboard()
keyboard.debug_enabled = False
keyboard.modules.append(split)
keyboard.modules.append(Layers())
keyboard.modules.append(holdtap)

keyboard.col_pins = (board.GP20, board.GP21, board.GP22, board.GP26, board.GP27, board.GP28)
keyboard.row_pins = (board.GP19, board.GP18, board.GP17, board.GP16)
keyboard.diode_orientation = DiodeOrientation.COL2ROW

L1D = KC.LT( 1, KC.D )
L1K = KC.LT( 1, KC.K )
RSFT = KC.HT(KC.J, KC.RSFT)
RSFTL2 = KC.HT(KC.N7, KC.RSFT)
LSFT = KC.HT(KC.F, KC.LSFT)
LSFTL2 = KC.HT( KC.N4, KC.LSFT)
_______ = KC.TRNS
XXXXXXX = KC.NO
#BSPC = KC.LT( 1, KC.BSPC )
BSPC = KC.BSPC

EST_Y = KC.RALT(KC.LBRC)   # ü
EST_EO = KC.RALT(KC.RBRC)  # õ
EST_OO = KC.RALT(KC.SCLN)  # ö
EST_AE = KC.RALT(KC.QUOT)  # ä

CATAB = simple_key_sequence((
    KC.LCTRL(no_release=True),
    KC.LALT(no_release=True),
    KC.MACRO_SLEEP(30),
    KC.DEL,
    KC.MACRO_SLEEP(30),
    KC.LALT(no_press=True),
    KC.LCTRL(no_press=True)
))

keyboard.keymap = [
    [
        KC.TAB ,     KC.Q,     KC.W,     KC.E,     KC.R,      KC.T,           KC.Y,    KC.U,     KC.I,     KC.O,     KC.P,  KC.MINS,
        KC.ESC ,     KC.A,     KC.S,     KC.D,     LSFT,      KC.G,           KC.H,    RSFT,     KC.K,     KC.L,  KC.SCLN,  KC.QUOT,
        KC.LCTRL,    KC.Z,     KC.X,     KC.C,     KC.V,      KC.B,           KC.N,    KC.M,  KC.COMM,   KC.DOT, KC.SLASH,  KC.LWIN,
        XXXXXXX,  XXXXXXX,  XXXXXXX,  KC.LALT,   KC.SPC,    KC.ENT,        KC.BSPC,KC.MO(1), KC.MO(2),  XXXXXXX,  XXXXXXX,  XXXXXXX
    ],
    # L1 : symbols and numbers
    [
         KC.GRV,  KC.EXLM,    KC.AT,  KC.HASH,  KC.DLR ,  KC.PERC,        KC.CIRC,  KC.AMPR,  KC.ASTR,  KC.LPRN,  KC.PLUS,  KC.EQL,
        KC.CAPS,    KC.N1,    KC.N2,    KC.N3,   LSFTL2,    KC.N5,          KC.N6,   RSFTL2,    KC.N8,    KC.N9,    KC.N0,  KC.QUOT,
        _______,  _______,  KC.LABK,  KC.LPRN,  KC.LBRC,  KC.LCBR,        KC.RCBR,  KC.RBRC,  KC.RPRN,  KC.RABK,  KC.BSLS,  _______,
        XXXXXXX,  XXXXXXX,  XXXXXXX,  _______,  _______,  _______,        _______,  _______,  _______,  XXXXXXX,  XXXXXXX,  XXXXXXX,
    ],
    [
          CATAB,  _______,  _______,  _______,  _______,   KC.DEL,        _______,  _______,  _______,  _______,    EST_Y,   EST_EO,
        _______,  _______,  _______,  _______,  _______,  _______,        KC.LEFT,  KC.DOWN,    KC.UP,  KC.RGHT,   EST_OO,   EST_AE,
        _______,  _______,  _______,  _______,  _______,  _______,        _______,  _______,  _______,  _______,  _______,  _______,
        XXXXXXX,  XXXXXXX,  XXXXXXX,  _______,  _______,  _______,        _______,  _______,  _______,  XXXXXXX,  XXXXXXX,  XXXXXXX,
    ]
]

if __name__ == "__main__":
    print("hello kmk")
    keyboard.go()
