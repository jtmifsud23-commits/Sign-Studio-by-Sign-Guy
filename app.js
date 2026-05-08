const SIZE_PRESETS = {
  small: { label: 'Small 10"', inches: 10, depth: 33 },
  large: { label: 'Large 13"', inches: 13, depth: 33 },
  xl: { label: 'XL 16"', inches: 16, depth: 33 },
};

const USAGE_PRESETS = {
  indoor: { label: 'Indoor' },
  outdoor: { label: 'Outdoor' },
};

const SHOPIFY_CHECKOUT_BASE_URL = 'https://mysignguy.ca/cart';
const SHOPIFY_CUSTOM_LOGO_BAR_LIGHT_VARIANTS = {
  small: {
    indoor: '48516981588108',
    outdoor: '48516981620876',
  },
  large: {
    indoor: '48516981653644',
    outdoor: '48516981686412',
  },
  xl: {
    indoor: '48516981719180',
    outdoor: '48516981751948',
  },
};

const CONTACT_EMAIL = 'Hey@MySignGuy.ca';
const SUBMISSION_SUBJECT = 'User submitted sign to print';
const ORDER_SUBMISSION_SUBJECT = 'User placed a lightbox order';
const DEFAULT_PREVIEW_SRC = './assets/sign-guy-logo-transparent.png';
const DEFAULT_PREVIEW_DATA_URL = `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiIHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiPgogIDwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyOS4zLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiAyLjEuMCBCdWlsZCAxNDYpICAtLT4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLnN0MCB7CiAgICAgICAgZmlsbDogIzY3NmI2ZjsKICAgICAgfQoKICAgICAgLnN0MSB7CiAgICAgICAgZmlsbDogIzJjMzMzNzsKICAgICAgfQoKICAgICAgLnN0MiB7CiAgICAgICAgZmlsbDogI2Y3YzAyNzsKICAgICAgfQoKICAgICAgLnN0MyB7CiAgICAgICAgZmlsbDogI2VhYmM5MzsKICAgICAgfQoKICAgICAgLnN0NCB7CiAgICAgICAgZmlsbDogI2ZkZmRmZDsKICAgICAgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPGc+CiAgICA8cGF0aCBjbGFzcz0ic3QxIiBkPSJNNTg3LjUsODguNWMyLjcsMi4zLDEzLjQsMy42LDE4LjMsNS4yLDE5LjYsNi40LDM2LjMsMTguMyw0OS4xLDMzLjksMjMuNCwyOC43LjMsNzAuOS0zMy45LDc2bDcuMSw4OC45YzEuMSwzOC45LDUuNCw3OS43LTE0LDExNSwzNS42LDEzLjYsNzEuNywzMi42LDkyLjcsNjUuNWg5OC44YzE1LjcsMS4yLDI1LjksMTEuMiwyOC40LDI2LjZ2NjYuNGMyMS41LjgsMzEuOCwyMiwzMC4xLDQxLjUtLjMsNC0zLjYsMTItMy42LDE0LDAsMyw2LjUsMTUuMSw2LjUsMjIuMS4xLDkuNy01LjMsMTUuMi02LjQsMjEuMy0uNSwyLjgsMS40LDgsMS41LDExLjYuMywxMy43LTcuMywyOC4xLTE4LjcsMzUuNHMtOC44LDIuOS05LjMsNS43djE3MWMtMy4xLDM0LjktNDAuMiwyNy45LTY1LjUsMjkuNC04My45LDUuMi0xNjcuOSw5LjctMjUxLjksMTQuMS00LjguMy0zLjYuMy04LjEuOXMtOCwxLTkuOSwxLjJjLTQuNC41LTE0LS4zLTIwLDAtNzcuMywyLjktMTU0LjcsOC41LTIzMiwxMi0yNi4xLDEuMi02Ni44LDExLjUtNzMuNS0yNC41di0xODIuOWMtMTEuOS0zLjgtMjMuMS0xMC4xLTMxLTIwLjEtMjEtMjYuOC0yMi42LTY0LjYtMTMuNy05Ni43czExLjgtMjYuMywxOS41LTM4LjUsMTMuMS0xOS4zLDI1LjEtMjIuNGMzLjMtMjYuOC0xMi4xLTgwLjQsMjUuNy04Ny44LDIuNi0uNSw1LjkuNiw4LjQtLjZzNi44LTExLjMsOS0xNGM2LjUtNy45LDE5LjItMTYuNSwyOC0yMiwyOS45LTE4LjUsNjUuMS0zMC40LDk4LjktMzkuNi0zLjMtMTItOC44LTIzLjQtMTAtMzUuOS0xMS40LS4zLTIzLjMtMS0zMy4yLTcuMS0xNC40LTguOC0yOS0yNy0zNC00My4yLTkuOC0zMS43LS42LTY1LjUsMjcuMi04NC41LTUuMi00Ny45LTguOS05MS45LDI0LjYtMTMwLjMsNjIuNS03MS43LDE5MC4yLTEwMC45LDI1OS0yMiwzLjQsMy45LDcuNywxMS43LDExLDE0LjVaTTU1Nyw4OWMtNDAtNDIuOC0xMDYtNTEuMS0xNTYuMy0yMC44LTMxLjgsMTkuMi0zNC40LDQxLjEtMzEuNyw3Ni4zczIuMiwxNS4xLDMsMjIuNWM1Mi4xLTQ0LDExNC45LTc4LjEsMTg1LTc4Wk0zNDgsMTAyYy0xLjEtMS4xLTguNCw2LjgtOS41LDgtMjcuNSwzMC4zLTI2LjIsNjYuOS0yMS41LDEwNS41LjEsMS4xLjMsMy4yLDEuNiwzLjUsMiwuNCwyNy41LTIzLjgsMzEuMy0yNi43LTMuMy0yOS44LTcuNy02MC41LTEuOS05MC4zWk02MzQsMTQ2Yy0yMy42LTMzLjYtNzMuMy0zNC43LTExMC40LTI5LjktNDAuOCw1LjMtOTAsMjYuOC0xMjAuNSw1NC41LTEuMSwxLTIuNSwxLjUtMi4xLDMuNCwyMC42LTkuOSw0MS4zLTE5LjUsNjMuMi0yNi4zLDUzLjItMTYuNSwxMTcuNS0yNS4xLDE2OS44LTEuN1pNMzk5LjUsMTc0bC0xLjUsMS41YzAsMSwyLjUtLjYsMS41LTEuNVpNMzk2LjUsMTc2djFjLjYtLjMuNi0uNywwLTFaTTMzNCwyOTl2LTE3LjVjMC0zLTMuNC0xNC4xLTQuOC0xNy4yLTguMy0xOC4xLTMwLjktMTkuMS0zOC45LS41LTEyLjgsMjkuNiw2LjMsNzAuMyw0MS4yLDcwLDMuNSwwLDE0LjMtMy4zLDE2LjEtMS45LDcuOCwyMi45LDE0LjQsNDUuNiwyOC4yLDY1LjgsNjMuOSw5NC4yLDIwOC4yLDg0LjksMjI4LjktMzcuNSw2LjYtMzguOC0xLjItMTEyLjYtNy45LTE1Mi41LS43LTQuMy0yLjUtMTYuOC0zLjktMTkuOS0yLjMtNS4yLTQ3LjEtMTEuNC01NC40LTExLjgtNDMuNy0yLjMtOTQuMiwzLjUtMTM0LjUsMjAuNi01LjUsMi4zLTQxLjIsMTkuNy00MS44LDIzLjEsMy4xLDE0LjgsMy4zLDMwLjgsMi44LDQ1LjlzMCwxMC4xLS4zLDEzLjdjLTEuNywyMC40LTExLjgsMjMuMi0zMC43LDE5LjhaTTM1MC44LDQyNC4yYy0zLjEtMS45LTIzLDQuMi0yNy42LDUuNi0zMC45LDkuMi02Mi44LDI1LjctODcsNDctLjcuNi0xLjksMC0xLjMsMi4zbDE0Ny0yLTE5LjItMjguM2MtMi44LTIuOC0xMC44LTIzLjgtMTItMjQuNVpNNjczLDQ3NWMxLjItMS0yLjgtNC4yLTMuNS01LTEwLjgtMTAuNC0zMC4xLTIyLjgtNDMuOC0yOS4ycy0yMC41LTguOS0yMy4yLTguOC0xMS41LDEzLjMtMTMuOSwxNmMtNi4xLDYuNi0xNC4zLDE0LjEtMjEuNiwxOS40cy04LjksNS4zLTEyLjksOC42bDExOS0xWk00MDguNSw0NzdjNS40LDEuNSwxNy4zLTEuMSwyMy41LDBsLTI0LjMtMTMuMi0xNi4yLTExLjhjMSwzLjcsMTUuMiwyNC41LDE3LDI1Wk0yMjEsNTcxdi00Ny41YzAtMi43LDYuMS04LjMsOS05czEyLjUtMS4zLDE2LjUtMS41YzczLjEtMy42LDE1MC41LS4yLDIyNC4xLS45LDEwNi41LTEsMjEzLjItMy44LDMxOS45LTMsNC4yLDAsMTEuNiw4LDExLjYsMTEuNHY1NS41bDEwLjEtMi42Yy0xLjYtMTkuNCwyLTQxLjksMC02MC45cy03LjgtMTMuOC0xNi41LTE0LjVjLTEzLjQtMS4yLTMxLjItLjEtNDUuMSwwLTk3LjkuOS0xOTYuMSwyLjUtMjkzLjksMy4xLTY5LC40LTEzOC4yLTEuMy0yMDcsMS0xNi40LjYtMzguNi01LjQtNDAuNiwxNy40czEuMSwzMy4xLDAsNDguOWwxMi4xLDIuNlpNNjAzLDYzMS41Yy44LTkuNC0uNi0xOS45LDAtMjkuNWwtNjIsMXYzMGgyNmMtMiwzMi40LTQxLjEsMzYuNi01OC44LDEzLjMtMjIuMS0yOC45LTcuMy04Mi4yLDM0LjItNzguMnMxOS4yLDUuOSwyNC42LDExLjQuNSw0LjcsNC4zLDQuMiwxOS45LTE2LjYsMjQuNi0xOS4zYy0xOC45LTI2LjItNTQuNy0zMy4yLTg0LjUtMjMuNS04Mi43LDI2LjktNjMuMSwxNjMsMzIuOSwxNTAuOSwzNC4zLTQuMyw1NS42LTI1LjYsNTguNi02MC40Wk03NTAsNTM3aC0zNnY4Ny41YzAsLjIsMi4zLDYuNy0xLDMuNXMtLjgtMi45LTEuNS00Yy0xNy42LTI4LjctMzQuMS01OC4xLTUzLTg2aC0zNS41djE1MWgzNXYtOTRjMS4zLDAsMS42LDEuNCwyLjIsMi4zLDE4LjgsMjkuNSwzNC4zLDYxLjMsNTMuMyw5MC43aDM3LjVsLTEtMTUxWk0yODAsNjUwYy0xLjQsNC40LTE1LjcsMjEuNC0xNC45LDI0LjMsMS4xLDQuMiwxOS44LDE0LDI0LjQsMTUuNywzOC44LDE0LjYsMTAwLjMtMS43LDg4LjItNTMuMi03LjItMzAuOS0zNS41LTI5LjQtNTgtMzlzLTIwLjUtMTUuNC05LjEtMjMuNiwzNC4yLS43LDQ1LjgsNy44YzMuMy02LjYsMTIuNS0xNS44LDE1LTIycy45LTEuNywwLTNjLTEuNS0yLjMtMTMuNy05LjctMTYuOS0xMS4yLTM3LjYtMTcuMy05Mi41LTIuOS04NS4yLDQ3LjIsNC42LDMxLjksMzIuNiwzMy41LDU2LjEsNDEuOXMxNS4zLDI3LjYtNSwyOS4xLTI3LjQtNy4yLTQwLjUtMTRaTTQzOCw1NDBoLTM4djE1MWgzOHYtMTUxWk0yMzcuNiw2NDIuNGMtNy03LTI0LjctMTAuNC0zNC40LTEyLjFzLTE3LS42LTIxLjUtMi41Yy03LjMtMy4xLjktOS4xLDYuOC05LjgsMTQuNi0xLjYsMjguMSw0LjEsNDEsNCwxMC4zLS4xLDE1LjgtOS4yLDkuOS0xNy45LTEwLjctMTUuOS01NS4yLTI2LjUtNjkuOS0xNC4xcy00LjgsOS41LTcuMSwxNC45LTcuNCwxMC44LTkuOSwxNy4xYy0xMCwyNC43LTkuMSw2Mi44LDkuNSw4My41czE5LjUsMTQuMywyOCw2LjVjLTUuMywxLjktOS45LTUuOS02LjEtOC42LDQuOC0zLjQsMzIuNyw0LjQsNDIuNS05LjVzLTQuNi0xNi40LTE1LjEtMTcuOC0zMCwuMi0zMy44LTQuMS0yLjEtNi41LjUtOC40YzcuMi01LjQsNDAuNiw2LjgsNTQuNSwxLjVzMTIuOC0xNSw1LjEtMjIuN1pNODI2LjgsNTg4LjJjLTEwLjguOS0zMy45LDExLjktMjYuMiwyNS43czI1LjUsOC40LDM0LjEsMy4zYzE1LTguOCwxMS4xLTMwLjUtNy45LTI5Wk04NDIuNyw2NTQuN2M1LjEtNSw1LjktMTUuMi4zLTIwLjFzLTE3LjYtLjctMjYuNC0uNWMtNi43LjEtMTAuNi0zLTE3LjUsMS41LTYuNyw0LjUtNS4zLDE0LjUsMSwxOC45LDcuOSw1LjQsMzUuNiw3LDQyLjYuMlpNNzk3LjcsNjY5LjFjLTQsMS4zLTMuOSw4LjEtMi43LDExLjUsNiwxNi43LDQ0LjMsMjQuOCw0NywyLjksMi0xNi44LTE4LjktMTItMjkuNC0xMi40cy0xMy4xLTIuNS0xNC44LTEuOVpNODEyLDcxM2MtMy41LDEuNS02LjQtLjItMTAsMHYxNjQuNWMwLC4zLTIuNSw0LjQtMyw1LTYuNSw3LjUtMjMuMyw0LjktMzIuNiw1LjQtMTcwLjgsOS42LTM0MS45LDE2LjctNTEzLDIzLTEwLjQuNC0yMS45LDQuNi0yOS41LTUuNS0uNi0uNy0zLTQuNy0zLTV2LTE4Mi41bC0xMCwxLC41LDE5M2M2LjMsMTUuNSwyNCwxMi4zLDM4LjEsMTIsMjcuOC0uNiw1Ni4xLTIuOCw4NC00LDEzNS42LTUuOCwyNzEuNS0xMi40LDQwNi45LTE5LjEsMTcuNS0uOSwzNi44LS4xLDU0LTJzMTcuNS02LjksMTcuNS0xMy41di0xNzIuNVpNNzI1LDcxNWgtMzguNWwtMjUsNTMtMjMuNS01MmgtNDFjMTIuNiwyNS45LDI2LjgsNTEuMSwzOS41LDc3LC45LDEuOSw2LjUsOS44LDYuNSwxMC41djYxYzAsLjQsMS42LDEuNywyLjQsMS41bDM0LjYtMXYtNjEuNWw0NS04OC41Wk0zODQsNzgzdjMwbDI4LTFjLS43LDM3LjctNTEuNSwzOC44LTY1LjUsOC0xMC40LTIyLjgtNi4zLTQ4LjksMTIuNi02NS40LDEyLjUtMTEsMzYuNS04LDQ4LjgsMnM2LjEsNy41LDYuNiw3LjRjNC40LS4xLDE5LjctMTcuNCwyNS41LTE5LTM1LjItNDcuOS0xMTUuMy0zNC41LTEzMi41LDIzLTE4LjgsNjIuOSwyMS44LDExOS4xLDg5LjcsMTAzLjdzNTEuNS00Ny45LDQ5LjgtODkuN2wtNjMsMVpNNTAyLDgwNy41Yy0yLTI5LjQsMS41LTYwLjksMC05MC41aC0zMy41Yy0uMywwLTMuNCwxLjItMy42LDEuNiwxLjEsMzEuNC0xLjMsNjMuNiwwLDk0LjksMS45LDQ3LjgsMzQuNCw2Ny4xLDgwLDUzLjksMjktOC4zLDM2LjYtMjksMzgtNTcsMS43LTMxLjQtMS44LTYzLjEtMS05NC41bC0zNiwxYy4yLDYuNS0uMiwxMywwLDE5LjUuNywyMi44LDQuNiw2Ni4yLTEsODYuOS01LjEsMTguOC0zMS4xLDIxLjctMzksNC4xcy0zLjYtMTQuNC00LTIwWiIvPgogICAgPHBhdGggY2xhc3M9InN0MCIgZD0iTTIyMSw1NzFsLTEyLjEtMi42YzEuMS0xNS44LTEuMy0zMy4zLDAtNDguOSwyLTIyLjksMjQuMS0xNi45LDQwLjYtMTcuNCw2OC44LTIuMywxMzgtLjYsMjA3LTEsOTcuOS0uNiwxOTYuMS0yLjIsMjkzLjktMy4xLDEzLjktLjEsMzEuNi0xLjIsNDUuMSwwczE1LjUsNS41LDE2LjUsMTQuNWMyLDE5LjEtMS42LDQxLjUsMCw2MC45bC0xMC4xLDIuNnYtNTUuNWMwLTMuNC03LjQtMTEuNS0xMS42LTExLjQtMTA2LjYtLjgtMjEzLjQsMS45LTMxOS45LDMtNzMuNi43LTE1MS0yLjctMjI0LjEuOXMtMTMuMi43LTE2LjUsMS41LTksNi4zLTksOXY0Ny41WiIvPgogICAgPHJlY3QgY2xhc3M9InN0NCIgeD0iNDAwIiB5PSI1NDAiIHdpZHRoPSIzOCIgaGVpZ2h0PSIxNTEiLz4KICAgIDxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0zNTAuOCw0MjQuMmMxLjIuNyw5LjIsMjEuNywxMiwyNC41bDE5LjIsMjguMy0xNDcsMmMtLjYtMi4zLjYtMS43LDEuMy0yLjMsMjQuMS0yMS4zLDU2LjEtMzcuOCw4Ny00Nyw0LjYtMS40LDI0LjYtNy41LDI3LjYtNS42WiIvPgogICAgPHBhdGggY2xhc3M9InN0MCIgZD0iTTY3Myw0NzVsLTExOSwxYzQtMy4zLDguOC01LjUsMTIuOS04LjYsNy4zLTUuMywxNS41LTEyLjgsMjEuNi0xOS40LDIuNS0yLjcsMTEuOS0xNS45LDEzLjktMTZzMTkuNiw3LjEsMjMuMiw4LjhjMTMuNyw2LjQsMzMsMTguOCw0My44LDI5LjIuOC43LDQuNyw0LDMuNSw1WiIvPgogICAgPHBhdGggY2xhc3M9InN0MyIgZD0iTTg0Mi43LDY1NC43Yy03LDYuOC0zNC43LDUuMi00Mi42LS4yLTYuMy00LjQtNy44LTE0LjQtMS0xOC45LDYuOC00LjUsMTAuNy0xLjMsMTcuNS0xLjUsOC45LS4yLDE4LjQtNi40LDI2LjQuNXM0LjgsMTUuMS0uMywyMC4xWiIvPgogICAgPHBhdGggY2xhc3M9InN0MyIgZD0iTTgyNi44LDU4OC4yYzE5LTEuNSwyMi45LDIwLjIsNy45LDI5cy0yOC41LDYuOC0zNC4xLTMuMywxNS40LTI0LjgsMjYuMi0yNS43WiIvPgogICAgPHBhdGggY2xhc3M9InN0MyIgZD0iTTc5Ny43LDY2OS4xYzEuOC0uNiwxMS45LDEuOCwxNC44LDEuOSwxMC41LjUsMzEuNC00LjQsMjkuNCwxMi40LTIuNiwyMS45LTQxLDEzLjktNDctMi45LTEuMi0zLjQtMS4zLTEwLjIsMi43LTExLjVaIi8+CiAgICA8cGF0aCBjbGFzcz0ic3Q0IiBkPSJNNzUwLDUzN2wxLDE1MWgtMzcuNWMtMTktMjkuNC0zNC42LTYxLjEtNTMuMy05MC43cy0uOS0yLjItMi4yLTIuM3Y5NGgtMzV2LTE1MWgzNS41YzE4LjksMjcuOSwzNS41LDU3LjMsNTMsODYsLjcsMS4xLDEuMywzLjksMS41LDQsMy4zLDMuMiwxLTMuMywxLTMuNXYtODcuNWgzNloiLz4KICAgIDxwYXRoIGNsYXNzPSJzdDQiIGQ9Ik02MDMsNjMxLjVjLTMuMSwzNC44LTI0LjMsNTYtNTguNiw2MC40LTk2LDEyLjEtMTE1LjYtMTI0LTMyLjktMTUwLjksMjkuOC05LjcsNjUuNy0yLjYsODQuNSwyMy41LTQuOCwyLjctMjAuOCwxOC43LTI0LjYsMTkuM3MtMy0yLjktNC4zLTQuMmMtNS41LTUuNS0xNi41LTEwLjYtMjQuNi0xMS40LTQxLjUtNC01Ni4zLDQ5LjMtMzQuMiw3OC4yLDE3LjgsMjMuMiw1Ni45LDE5LjEsNTguOC0xMy4zaC0yNnYtMzBsNjItMWMtLjYsOS42LjgsMjAuMSwwLDI5LjVaIi8+CiAgICA8cGF0aCBjbGFzcz0ic3Q0IiBkPSJNMjgwLDY1MGMxMy4xLDYuOCwyNC45LDE1LjEsNDAuNSwxNHMyNy0yMS4yLDUtMjkuMS01MS41LTEwLTU2LjEtNDEuOWMtNy4zLTUwLjEsNDcuNi02NC41LDg1LjItNDcuMiwzLjIsMS40LDE1LjQsOC44LDE2LjksMTEuMnMuNCwxLjgsMCwzYy0yLjUsNi4zLTExLjcsMTUuNS0xNSwyMi0xMS42LTguNi0zMi43LTE3LjItNDUuOC03LjhzLS4zLDE5LjYsOS4xLDIzLjZjMjIuNSw5LjYsNTAuOCw4LjEsNTgsMzksMTIsNTEuNS00OS41LDY3LjgtODguMiw1My4ycy0yMy4zLTExLjYtMjQuNC0xNS43LDEzLjUtMTkuOCwxNC45LTI0LjNaIi8+CiAgICA8Zz4KICAgICAgPHBhdGggY2xhc3M9InN0MCIgZD0iTTYzNCwxNDZjLTUyLjItMjMuNC0xMTYuNi0xNC44LTE2OS44LDEuNy0yMS45LDYuOC00Mi42LDE2LjMtNjMuMiwyNi4zLS40LTEuOSwxLTIuNCwyLjEtMy40LDMwLjUtMjcuNyw3OS44LTQ5LjIsMTIwLjUtNTQuNSwzNy4xLTQuOCw4Ni43LTMuNywxMTAuNCwyOS45WiIvPgogICAgICA8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMzQ4LDEwMmMtNS44LDI5LjgtMS40LDYwLjQsMS45LDkwLjMtMy44LDIuOS0yOS4zLDI3LjEtMzEuMywyNi43cy0xLjQtMi40LTEuNi0zLjVjLTQuNy0zOC43LTYtNzUuMiwyMS41LTEwNS41LDEuMS0xLjIsOC40LTkuMSw5LjUtOFoiLz4KICAgICAgPHBhdGggY2xhc3M9InN0MyIgZD0iTTQwOC41LDQ3N2MtMS44LS41LTE2LTIxLjMtMTctMjVsMTYuMiwxMS44LDI0LjMsMTMuMmMtNi4yLTEuMS0xOC4xLDEuNS0yMy41LDBaIi8+CiAgICAgIDxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0zOTYuNSwxNzZjLjYuMy42LjcsMCwxdi0xWiIvPgogICAgICA8cGF0aCBjbGFzcz0ic3QwIiBkPSJNMzk5LjUsMTc0YzEsLjktMS41LDIuNS0xLjUsMS41bDEuNS0xLjVaIi8+CiAgICAgIDxwYXRoIGNsYXNzPSJzdDQiIGQ9Ik01NTcsODljLTcwLDAtMTMyLjksMzQuMS0xODUsNzgtLjgtNy40LTIuNC0xNS0zLTIyLjUtMi43LTM1LjItLjEtNTcuMSwzMS43LTc2LjMsNTAuMy0zMC4zLDExNi4zLTIyLDE1Ni4zLDIwLjhaIi8+CiAgICAgIDxnPgogICAgICAgIDxwYXRoIGNsYXNzPSJzdDMiIGQ9Ik0zMzQsMjk5YzE5LDMuNCwyOS4xLjcsMzAuNy0xOS44cy4yLTkuNi4zLTEzLjdjLjQtMTUuMi4yLTMxLjItMi44LTQ1LjkuNi0zLjQsMzYuMy0yMC43LDQxLjgtMjMuMSw0MC4zLTE3LjEsOTAuOC0yMi45LDEzNC41LTIwLjYsNy4zLjQsNTIuMiw2LjYsNTQuNCwxMS44czMuMSwxNS42LDMuOSwxOS45YzYuNywzOS45LDE0LjQsMTEzLjgsNy45LDE1Mi41LTIwLjgsMTIyLjQtMTY1LDEzMS43LTIyOC45LDM3LjUtMTMuOC0yMC4zLTIwLjQtNDMtMjguMi02NS44LTEuOC0xLjQtMTIuNiwxLjktMTYuMSwxLjktMzUsLjMtNTQtNDAuNC00MS4yLTcwLDgtMTguNiwzMC43LTE3LjYsMzguOS41czQuOCwxNC4yLDQuOCwxNy4ydjE3LjVaTTU3Ni42LDIwNS40Yy0xMS44LTkuNS01My4yLTExLTQ4LjQsOS45LDIuNiwxMS40LDEzLjgsMy42LDIwLjQsMi44LDQuMS0uNSwxMS44LS42LDE1LjktLjEsOC4xLjksMjYuMywxNC4yLDE5LTQtLjktMi4yLTUtNy4xLTYuOS04LjZaTTQxMS4xLDIyNy45YzIuMywxLjUsMjUuOC03LjIsMzEuNS03LjhzMTMuMy44LDE5LjksMWMxMS41LjIsMTguMy0xMi4xLDcuMi0xOC4zcy00My0xLjYtNTMuMiw5LjJjLTIuMywyLjQtOS40LDEzLjMtNS4zLDE1LjlaTTU1MS43LDI0NC4yYy0xMC4yLDIuMS0xMywxNy41LTExLjcsMjYuMnMxMS44LDE2LDE4LjQsMTUuNWMxNi42LTEuMSwxNi40LTQ2LjUtNi43LTQxLjdaTTQ0NS44LDI0Ni4yYy0yMS45LDMuMi0yMi40LDUzLjMsNi4yLDQzLjMsMTYuNC01LjgsMTMuMS00Ni4xLTYuMi00My4zWk01MTkuNywyNTAuM2MtMS43LTIuNi04LjQtMy4xLTkuNS40LTMuMiw5LjQsNC41LDI5LjIsMTEuMywzNi40LDguNyw5LjEsMzUuNywxOS4zLDIwLjEsMzZzLTM0LjcsMTMuNy00Ny42LDEuNS0xMC0xNy4xLTEyLjQtMTYuNS00LjMsNy45LTUuNSw5LjVjLTIuNiwzLjUtMTMsNy0xNy4zLDkuNy04LjQsNS4xLTIwLjksMTguOC0zMC44LDEwLjQtNS4yLTQuNS00LTE4LjMtMTMuMi0xNi40cy02LjcsMjMtMy42LDMwLjJjMTAuNSwyNCwzOSwyOC4yLDYyLjQsMjYuN3MzMC4yLTYuMiw0MS0xN2MyLS42LDEuNCwxLjcsMi45LDMsMjUuMywyMS40LDgwLjgsMTAsODQuNC0yNi42LjUtNS4xLTEuMi0xOS05LjItMTYuM3MtNC40LDExLjgtMTMuMSwxMS45LTIwLjktOS4xLTIyLjEtMTEsLjgtOSwuNS0xMS41Yy0xLjgtMTkuMy0yMi0yMi4yLTMwLjgtMzQuMnMtNS41LTEzLjUtNi44LTE5LC43LTUtLjctNy4xWk0zMDksMzA0YzE1LjcsMS4xLDE3LjctNi4zLDE1LjctMjAuMi0xLjItOC42LTUuMy0xMy4yLTE0LjMtOS44cy03LjIsOC4yLTUuNCwxNS4xYzEuNCwxLjIsOS40LTQuNywxMC44LS40cy40LDcuNy0uMyw5LjRjLTEuMiwyLjUtNi44LDIuNC02LjUsNlpNNTM3LjcsMzgyLjFjLTEuNy4zLTkuNiw0LjgtMTMuMiw1LjktOS42LDIuOS0xNS41LDMuNy0yNS4zLDEuMy00LjQtMS4xLTE0LjMtNi42LTE3LjMtMi45czIuNyw5LjQsNS42LDExLjZjMTIuOCw5LjYsNDAuOSw4LjMsNTEtNXM1LjktMTEuOS0uOC0xMC45WiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik01MTkuNywyNTAuM2MxLjMsMi4xLjMsNS4zLjcsNy4xLDEuMyw1LjUsMy41LDE0LjUsNi44LDE5LDguOSwxMiwyOSwxNC45LDMwLjgsMzQuMnMtLjgsMTEtLjUsMTEuNWMxLjIsMS45LDE5LjIsMTEuMSwyMi4xLDExLDguOCwwLDEwLjUtMTEsMTMuMS0xMS45LDgtMi43LDkuNywxMS4xLDkuMiwxNi4zLTMuNywzNi43LTU5LjEsNDgtODQuNCwyNi42LTEuNi0xLjMtLjktMy42LTIuOS0zLTEwLjcsMTAuOC0yNiwxNi00MSwxNy0yMy40LDEuNS01MS45LTIuNi02Mi40LTI2LjctMy4xLTcuMS02LjctMjguMSwzLjYtMzAuMnM4LDExLjksMTMuMiwxNi40YzkuOCw4LjQsMjIuNC01LjMsMzAuOC0xMC40czE0LjctNi4yLDE3LjMtOS43LDMuNi05LjEsNS41LTkuNSw5LjUsMTMuOCwxMi40LDE2LjVjMTIuOSwxMi4yLDM1LjUsMTEuNSw0Ny42LTEuNXMtMTEuNC0yNi45LTIwLjEtMzZjLTYuOC03LjEtMTQuNS0yNi45LTExLjMtMzYuNHM3LjktMyw5LjUtLjRaIi8+CiAgICAgICAgPHBhdGggY2xhc3M9InN0MSIgZD0iTTQ0NS44LDI0Ni4yYzE5LjMtMi44LDIyLjcsMzcuNSw2LjIsNDMuMy0yOC42LDEwLjEtMjguMi00MC4xLTYuMi00My4zWiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik00MTEuMSwyMjcuOWMtNC4xLTIuNiwzLTEzLjUsNS4zLTE1LjksMTAuMi0xMC44LDQwLjUtMTYuMyw1My4yLTkuMnM0LjIsMTguNS03LjIsMTguMy0xMi42LTEuNy0xOS45LTEtMjkuMiw5LjItMzEuNSw3LjhaIi8+CiAgICAgICAgPHBhdGggY2xhc3M9InN0MSIgZD0iTTU1MS43LDI0NC4yYzIzLjEtNC44LDIzLjMsNDAuNyw2LjcsNDEuNy02LjYuNC0xNy40LTkuMi0xOC40LTE1LjVzMS41LTI0LjEsMTEuNy0yNi4yWiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik01NzYuNiwyMDUuNGMxLjksMS41LDYsNi40LDYuOSw4LjYsNy4zLDE4LjItMTAuOSw0LjktMTksNHMtMTEuOC0uNC0xNS45LjFjLTYuNi44LTE3LjgsOC42LTIwLjQtMi44LTQuOC0yMC45LDM2LjYtMTkuNCw0OC40LTkuOVoiLz4KICAgICAgICA8cGF0aCBjbGFzcz0ic3QxIiBkPSJNNTM3LjcsMzgyLjFjNi43LTEsMyw4LC44LDEwLjktMTAuMSwxMy4zLTM4LjIsMTQuNS01MSw1LTIuOS0yLjItOC42LTcuOS01LjYtMTEuNnMxMi45LDEuOSwxNy4zLDIuOWM5LjgsMi40LDE1LjcsMS42LDI1LjMtMS4zczExLjYtNS42LDEzLjItNS45WiIvPgogICAgICAgIDxwYXRoIGNsYXNzPSJzdDEiIGQ9Ik0zMDksMzA0Yy0uMy0zLjYsNS4zLTMuNCw2LjUtNnMuOS03LjcuMy05LjRjLTEuNC00LjQtOS41LDEuNS0xMC44LjQtMS44LTYuOS0yLjEtMTIuMyw1LjQtMTUuMXMxMy4xLDEuMiwxNC4zLDkuOGMyLDEzLjksMCwyMS40LTE1LjcsMjAuMloiLz4KICAgICAgPC9nPgogICAgPC9nPgogIDwvZz4KICA8Zz4KICAgIDxwYXRoIGNsYXNzPSJzdDIiIGQ9Ik02MzUuMSwzOTkuOWMzMC41LDEzLjYsNTguOSwzMi4yLDgwLjYsNTcuOSwyNC41LDEuMyw0OS4yLS43LDczLjYtLjQsMjAsLjMsMzYuNi0uMyw1MC4xLDE2LjdzOS4xLDI2LDkuNiw0MS40LS40LDI2LjYsMCwzOS45YzI1LjUsMTEuNiwyOS44LDMwLjEsMjksNTYuMSwwLDIuNi0xLjcsNS43LTEuNSw4LC4yLDMuNywzLjksMTAuNCw0LjQsMTUuMSwxLDguNywwLDE3LjMtMi4yLDI1LjZzLTEuNSw3LjMtMS42LDE2LjNjLS40LDE5LjEtMTEuMSwzOS4xLTI4LjEsNDguMnYxNjMuOGMtNSw0Ny4yLTQ0LjksNDQuMS04MS41LDQ2LjUtMTIwLjIsNy44LTI0MC44LDEyLjEtMzYxLDE4LTY0LjUsMy4yLTEzMC42LDguOC0xOTQuOSwxMC4xcy01MC43LTEzLjQtNTQuNS00NC42di0xNjkuOGMtMjIuNi0xMS0zOC45LTMzLjMtNDQuNS01Ny43cy00LTY4LjgsMTAuMy05NC43YzQuNi04LjMsOS43LTE2LjQsMTQuMy0yNC43czExLjMtMTUuNCwxOS44LTIwLjRjMS4yLTMxLjEtNy43LTY5LjgsMjQuNy04OC4xLDQuNS0yLjYsMTMuNC00LjQsMTUuOC02LjJzMy4yLTUuMiw0LjktNy4xYzMwLTMyLjksNzkuNS01MS4yLDEyMS41LTYzLC4zLS41LTIuOC05LjgtNC0xMC41cy0xMC44LTIuMi0xMy44LTMuMmMtNTQuOS0xOC40LTc5LTk1LjctNDIuNi0xNDEuMiwyLjYtMy4zLDExLjgtMTAuNywxMi40LTEzLjYsMS01LjEtMS44LTE2LjEtMi0yMS45LTIuMi01OS40LDkuMi05NS41LDU1LjYtMTMzLjUsNzguNi02NC41LDE5MC4zLTcyLjcsMjYzLDUsMS44LDEuOSwzLjIsNS43LDUuMSw2LjlzMTMuNiwzLjUsMTcuOSw1LjFjNTEuNSwxOC43LDkyLjUsNzUuNCw0NCwxMjItNi4xLDUuOS0xNCw5LjYtMjEuNCwxMy42bDYuOSwxMDIuOGMuMywyMC43LjQsNDAuNS00LjQsNjAuNy0uOCwzLjMtNi4zLDE5LjUtNS42LDIwLjdaTTU4Ny41LDg4LjVjLTMuMy0yLjgtNy42LTEwLjYtMTEtMTQuNS02OC45LTc4LjktMTk2LjYtNDkuNy0yNTksMjItMzMuNSwzOC40LTI5LjgsODIuNS0yNC42LDEzMC4zLTI3LjcsMTktMzcsNTIuOC0yNy4yLDg0LjVzMTkuNiwzNC40LDM0LDQzLjJjOS45LDYuMSwyMS44LDYuNywzMy4yLDcuMSwxLjIsMTIuNSw2LjgsMjQsMTAsMzUuOS0zMy45LDkuMi02OSwyMS4xLTk4LjksMzkuNi04LjgsNS40LTIxLjUsMTQuMS0yOCwyMnMtNy45LDEzLjQtOSwxNGMtMi41LDEuMi01LjgsMC04LjQuNi0zNy44LDcuNC0yMi4zLDYxLTI1LjcsODcuOC0xMiwzLjEtMTguOSwxMi42LTI1LjEsMjIuNHMtMTUuNiwyNC4yLTE5LjUsMzguNWMtOC45LDMyLjEtNy4yLDY5LjksMTMuNyw5Ni43czE5LjEsMTYuMywzMS4xLDIwLjF2MTgyLjljNi42LDM2LDQ3LjQsMjUuNyw3My40LDI0LjUsNzcuMy0zLjUsMTU0LjctOS4xLDIzMi0xMiw2LS4yLDE1LjYtLjUsMjAtLjlzOSwwLDEwLjktLjJjNC41LS42LDIuMy0uNiw3LjEtLjksODQtNC40LDE2OC04LjksMjUxLjktMTQuMSwyNS4zLTEuNiw2Mi41LDUuNSw2NS42LTI5LjR2LTE3MWMuNS0yLjgsNi42LTQsOS4zLTUuNywxMS41LTcuMywxOS4xLTIxLjcsMTguNy0zNS40LDAtMy41LTItOC43LTEuNS0xMS42LDEuMS02LjEsNi41LTExLjUsNi40LTIxLjMsMC03LTYuNS0xOS02LjUtMjIuMXMzLjMtMTAsMy42LTE0YzEuNy0xOS41LTguNi00MC42LTMwLTQxLjV2LTY2LjRjLTIuNi0xNS40LTEyLjctMjUuNC0yOC41LTI2LjZoLTk4LjhjLTIxLTMyLjktNTcuMS01MS45LTkyLjctNjUuNSwxOS40LTM1LjMsMTUuMS03Ni4yLDE0LTExNWwtNy4xLTg4LjljMzQuMi01LjEsNTcuNC00Ny4zLDMzLjktNzYtMTIuNy0xNS42LTI5LjUtMjcuNS00OS4xLTMzLjktNC45LTEuNi0xNS42LTMtMTguMy01LjJaIi8+CiAgICA8cGF0aCBjbGFzcz0ic3Q0IiBkPSJNMzg0LDc4M2w2My0xYzEuNyw0MS44LTMuMiw3OS4xLTQ5LjgsODkuNy02Ny45LDE1LjQtMTA4LjUtNDAuOC04OS43LTEwMy43LDE3LjItNTcuNSw5Ny4zLTcwLjksMTMyLjUtMjMtNS43LDEuNy0yMS4xLDE4LjktMjUuNSwxOXMtNC42LTUuOC02LjYtNy40Yy0xMi4zLTEwLTM2LjMtMTMtNDguOC0yLTE4LjksMTYuNS0yMyw0Mi42LTEyLjYsNjUuNCwxNCwzMC44LDY0LjgsMjkuNyw2NS41LThsLTI4LDF2LTMwWiIvPgogICAgPHBhdGggY2xhc3M9InN0NCIgZD0iTTUwMiw4MDcuNWMuNCw1LjcsMS42LDE0LjcsNCwyMCw3LjgsMTcuNiwzMy45LDE0LjcsMzktNC4xLDUuNi0yMC43LDEuNy02NC4xLDEtODYuOS0uMi02LjUuMi0xMy4xLDAtMTkuNWwzNi0xYy0uNywzMS40LDIuNyw2My4xLDEsOTQuNS0xLjUsMjgtOS4xLDQ4LjYtMzgsNTctNDUuNiwxMy4xLTc4LjEtNi4yLTgwLTUzLjlzMS4xLTYzLjUsMC05NC45Yy4xLS40LDMuMy0xLjYsMy42LTEuNmgzMy41YzEuNSwyOS42LTIsNjEuMSwwLDkwLjVaIi8+CiAgICA8cGF0aCBjbGFzcz0ic3QwIiBkPSJNODEyLDcxM3YxNzIuNWMwLDYuNi0xMS42LDEyLjktMTcuNSwxMy41LTE3LjIsMS44LTM2LjYsMS4xLTU0LDItMTM1LjUsNi43LTI3MS40LDEzLjMtNDA2LjksMTkuMS0yNy45LDEuMi01Ni4yLDMuNC04NCw0LTE0LC4zLTMxLjgsMy41LTM4LjEtMTJsLS41LTE5MywxMC0xdjE4Mi41YzAsLjMsMi40LDQuMywzLDUsNy41LDEwLDE5LjEsNS44LDI5LjUsNS41LDE3MS4xLTYuMywzNDIuMi0xMy40LDUxMy0yMyw5LjItLjUsMjYuMSwyLjEsMzIuNi01LjRzMy00LjcsMy01di0xNjQuNWMzLjYtLjIsNi41LDEuNSwxMCwwWiIvPgogICAgPHBhdGggY2xhc3M9InN0NCIgZD0iTTcyNSw3MTVsLTQ1LDg4LjV2NjEuNWwtMzQuNiwxYy0uOC4yLTIuNC0xLTIuNC0xLjV2LTYxYzAtLjYtNS42LTguNi02LjUtMTAuNS0xMi43LTI1LjktMjYuOS01MS4xLTM5LjUtNzdoNDFsMjMuNSw1MiwyNS01M2gzOC41WiIvPgogICAgPHBhdGggY2xhc3M9InN0MyIgZD0iTTIzNy42LDY0Mi40YzcuNyw3LjcsNC45LDE4LjktNS4xLDIyLjdzLTQ3LjMtNi45LTU0LjUtMS41LTIuNiw2LS41LDguNGMzLjgsNC40LDI2LjUsMy4xLDMzLjgsNC4xczI0LjcsNC4xLDE1LjEsMTcuOC0zNy42LDYuMS00Mi41LDkuNWMtMy44LDIuNy43LDEwLjQsNi4xLDguNi04LjUsNy44LTIxLjMuOS0yOC02LjUtMTguNy0yMC42LTE5LjUtNTguOC05LjUtODMuNXM3LjgtMTIsOS45LTE3LjEsMS40LTEwLjIsNy4xLTE0LjljMTQuOC0xMi40LDU5LjItMS44LDY5LjksMTQuMSw1LjksOC43LjQsMTcuOC05LjksMTcuOS0xMi45LjEtMjYuNC01LjYtNDEtNC01LjguNy0xNC4xLDYuNy02LjgsOS44czE1LjgsMS41LDIxLjUsMi41YzkuNywxLjcsMjcuNCw1LjEsMzQuNCwxMi4xWiIvPgogIDwvZz4KPC9zdmc+Cg==`;
const PROJECT_FILE_VERSION = 1;
const PROJECT_DB_NAME = 'SignGuyLightboxStudio';
const PROJECT_STORE_NAME = 'projects';
const PROJECT_LOG_LIMIT = 12;
const EMAIL_STORAGE_KEY = 'signGuyCustomerEmail';
const ADMIN_SESSION_KEY = 'signGuyAdminMode';
const LOCAL_ADMIN_PASSWORD = '77\\r(~68dKTE';
const LOADING_MIN_VISIBLE_MS = 1500;
let projectDbPromise = null;
const loadingProgress = {
  current: 0,
  target: 0,
  raf: null,
  startedAt: performance.now(),
};

const CROP_PRESETS = [
  { id: '1:1', label: '1:1', ratio: 1, icon: 'ratio-1' },
  { id: '4:3', label: '4:3', ratio: 4 / 3, icon: 'ratio-43' },
  { id: '3:2', label: '3:2', ratio: 3 / 2, icon: 'ratio-32' },
  { id: '16:9', label: '16:9', ratio: 16 / 9, icon: 'ratio-169' },
  { id: 'circle', label: 'Circle', ratio: 1, icon: 'circle' },
  { id: 'free', label: 'Free', ratio: null, icon: 'ratio-1' },
];

const PRESET_COLOURS = [
  '#ffffff', '#f2e6db', '#e8c16b', '#d6d9d2', '#a6aaa4', '#807b4d', '#913827', '#f4f1eb', '#b62035',
  '#ee3e70', '#ff6080', '#fb7447', '#ff9a19', '#ffc400', '#f3ef45', '#88c43f', '#00a651', '#2f7f3b',
  '#16b8c1', '#0b86c8', '#003f8c', '#001c42', '#5148a8', '#4a2765', '#5d6674', '#dfe2e2', '#55585b', '#000000',
];

const state = {
  fileName: '',
  designName: '',
  customerEmail: '',
  isAdmin: false,
  isDefaultPreview: false,
  size: 'large',
  usage: 'indoor',
  illuminated: true,
  removeBg: true,
  tolerance: 64,
  targetColorCount: 8,
  colorOverrides: [],
  frontColoursCustomized: false,
  selectedColor: 0,
  selectedColourTarget: { type: 'front', index: 0 },
  shellColours: {
    side: '#000000',
    back: '#000000',
  },
  projectId: null,
  savedProjects: [],
  three: null,
  wizardStep: null,
  edit: {
    crop: { x: 0, y: 0, w: 1, h: 1 },
    cropAspect: 'free',
    zoom: 1,
  },
  artwork: null,
  uploadedFile: null,
  processed: null,
  rotation: { x: 0, y: 0, z: 0 },
  previewZoom: 1,
  dismissedPreviewAlert: '',
};

const els = {
  fileInput: document.querySelector('#fileInput'),
  chooseFile: document.querySelector('#chooseFile'),
  chooseFileText: document.querySelector('#chooseFileText'),
  dropZone: document.querySelector('#dropZone'),
  statusPill: document.querySelector('#statusPill'),
  emailGate: document.querySelector('#emailGate'),
  emailGateForm: document.querySelector('#emailGateForm'),
  emailGateError: document.querySelector('#emailGateError'),
  customerEmail: document.querySelector('#customerEmail'),
  designName: document.querySelector('#designName'),
  sizeOutput: document.querySelector('#sizeOutput'),
  usageOutput: document.querySelector('#usageOutput'),
  frontPlateColours: document.querySelector('#frontPlateColours'),
  sideColourButton: document.querySelector('#sideColourButton'),
  backColourButton: document.querySelector('#backColourButton'),
  sideColourHex: document.querySelector('#sideColourHex'),
  backColourHex: document.querySelector('#backColourHex'),
  warnings: document.querySelector('#warnings'),
  previewAlert: document.querySelector('#previewAlert'),
  appLoading: document.querySelector('#appLoading'),
  loadingProgressBar: document.querySelector('#loadingProgressBar'),
  complexityScore: document.querySelector('#complexityScore'),
  frontSvg: document.querySelector('#frontSvg'),
  modelStack: document.querySelector('#modelStack'),
  stage: document.querySelector('#stage'),
  previewTitle: document.querySelector('#previewTitle'),
  editDesignName: document.querySelector('#editDesignName'),
  sessionEmailStat: document.querySelector('#sessionEmailStat'),
  dimensionStat: document.querySelector('#dimensionStat'),
  adminLoginButton: document.querySelector('#adminLoginButton'),
  adminGate: document.querySelector('#adminGate'),
  adminGateForm: document.querySelector('#adminGateForm'),
  adminPassword: document.querySelector('#adminPassword'),
  adminGateError: document.querySelector('#adminGateError'),
  adminCancel: document.querySelector('#adminCancel'),
  depthStat: document.querySelector('#depthStat'),
  illuminateToggle: document.querySelector('#illuminateToggle'),
  lightToggleLabel: document.querySelector('#lightToggleLabel'),
  previewZoomOut: document.querySelector('#previewZoomOut'),
  previewZoomReset: document.querySelector('#previewZoomReset'),
  previewZoomIn: document.querySelector('#previewZoomIn'),
  removeBg: document.querySelector('#removeBg'),
  submitDesign: document.querySelector('#submitDesign'),
  placeOrder: document.querySelector('#placeOrder'),
  submitNote: document.querySelector('#submitNote'),
  projectFileInput: document.querySelector('#projectFileInput'),
  saveProject: document.querySelector('#saveProject'),
  openProject: document.querySelector('#openProject'),
  projectCount: document.querySelector('#projectCount'),
  projectList: document.querySelector('#projectList'),
  projectNote: document.querySelector('#projectNote'),
  wizard: document.querySelector('#wizard'),
  wizardTitle: document.querySelector('#wizardTitle'),
  wizardClose: document.querySelector('#wizardClose'),
  wizardSide: document.querySelector('#wizardSide'),
  wizardFooter: document.querySelector('#wizardFooter'),
  wizardArtboard: document.querySelector('#wizardArtboard'),
  wizardImage: document.querySelector('#wizardImage'),
  cropBox: document.querySelector('#cropBox'),
  previewTools: document.querySelector('#previewTools'),
  zoomOut: document.querySelector('#zoomOut'),
  zoomIn: document.querySelector('#zoomIn'),
  colourPopover: document.querySelector('#colourPopover'),
  closeColourPopover: document.querySelector('#closeColourPopover'),
  presetGrid: document.querySelector('#presetGrid'),
  presetPane: document.querySelector('#presetPane'),
  customPane: document.querySelector('#customPane'),
  popoverSwatch: document.querySelector('#popoverSwatch'),
  popoverHex: document.querySelector('#popoverHex'),
  customColourInput: document.querySelector('#customColourInput'),
  rgbR: document.querySelector('#rgbR'),
  rgbG: document.querySelector('#rgbG'),
  rgbB: document.querySelector('#rgbB'),
};

boot();

async function boot() {
  setLoadingProgress(8);
  setupViewportUnits();
  setupEmailGate();
  setupAdminMode();
  setLoadingProgress(18);
  els.chooseFile.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    els.fileInput.click();
  });
  els.fileInput.addEventListener('change', () => handleFiles(els.fileInput.files));
  els.illuminateToggle.addEventListener('change', () => {
    state.illuminated = els.illuminateToggle.checked;
    applyIllumination();
    renderPreview();
  });
  els.removeBg.addEventListener('change', () => {
    state.removeBg = els.removeBg.checked;
    reprocess();
  });
  document.querySelectorAll('[data-size]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-size]').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      state.size = button.dataset.size;
      updateStats();
      renderPreview();
    });
  });
  document.querySelectorAll('[data-usage]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-usage]').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      state.usage = USAGE_PRESETS[button.dataset.usage] ? button.dataset.usage : 'indoor';
      updateStats();
      updateProjectControls();
    });
  });
  els.submitDesign?.addEventListener('click', () => submitDesignRequest());
  els.placeOrder.addEventListener('click', () => placeOrderRequest());
  els.saveProject.addEventListener('click', () => saveProjectFile());
  els.openProject.addEventListener('click', () => els.projectFileInput.click());
  els.projectFileInput.addEventListener('change', () => openProjectFiles(els.projectFileInput.files));
  els.designName.addEventListener('input', () => {
    state.designName = els.designName.value;
    renderPreviewTitle();
    updateProjectControls();
  });
  els.designName.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') finishDesignNameEdit();
    if (event.key === 'Escape') finishDesignNameEdit();
  });
  els.designName.addEventListener('blur', finishDesignNameEdit);
  els.editDesignName.addEventListener('click', startDesignNameEdit);
  els.sideColourButton.addEventListener('click', () => openShellColourPopover('side', els.sideColourButton));
  els.backColourButton.addEventListener('click', () => openShellColourPopover('back', els.backColourButton));
  els.wizardClose.addEventListener('click', closeWizard);
  els.zoomOut.addEventListener('click', () => setWizardZoom(state.edit.zoom - 0.1));
  els.zoomIn.addEventListener('click', () => setWizardZoom(state.edit.zoom + 0.1));
  els.previewZoomOut.addEventListener('click', () => setPreviewZoom(state.previewZoom - 0.15));
  els.previewZoomIn.addEventListener('click', () => setPreviewZoom(state.previewZoom + 0.15));
  els.previewZoomReset.addEventListener('click', () => setPreviewZoom(1));
  els.stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    setPreviewZoom(state.previewZoom + (event.deltaY < 0 ? 0.12 : -0.12));
  }, { passive: false });
  els.stage.addEventListener('click', (event) => {
    if (event.target.closest('[data-open-preview-alert]')) {
      els.previewAlert.classList.add('expanded');
      return;
    }
    if (!event.target.closest('[data-close-preview-alert]')) return;
    if (isResponsiveViewport()) {
      els.previewAlert.classList.remove('expanded');
      return;
    }
    state.dismissedPreviewAlert = els.previewAlert.dataset.signature || '';
    els.previewAlert.hidden = true;
  });
  els.closeColourPopover.addEventListener('click', closeColourPopover);
  els.popoverHex.addEventListener('change', () => applySelectedColour(normalizeHex(els.popoverHex.value)));
  els.customColourInput.addEventListener('input', () => applySelectedColour(els.customColourInput.value));
  [els.rgbR, els.rgbG, els.rgbB].forEach((input) => input.addEventListener('input', () => applyRgbInputs()));
  document.querySelectorAll('[data-popover-tab]').forEach((button) => {
    button.addEventListener('click', () => setPopoverTab(button.dataset.popoverTab));
  });
  buildPresetGrid();
  setLoadingProgress(42);
  setupDropZone();
  setupDragRotation();
  setupCropInteraction();
  initThreeStage();
  setLoadingProgress(62);
  updateStats();
  applyIllumination();
  renderShellColourControls();
  refreshProjectLog();
  await loadDefaultPreview();
  await finishAppLoading();
}

function setupEmailGate() {
  if (!els.emailGate || !els.emailGateForm || !els.customerEmail) return;
  const savedEmail = normalizeEmail(localStorage.getItem(EMAIL_STORAGE_KEY));
  if (savedEmail && isValidEmail(savedEmail)) {
    state.customerEmail = savedEmail;
    els.customerEmail.value = savedEmail;
    els.emailGate.classList.add('hidden');
    renderSessionEmail();
    refreshProjectLog();
    return;
  }
  window.setTimeout(() => els.customerEmail.focus(), 0);
  els.emailGateForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = els.customerEmail.value.trim();
    if (!isValidEmail(email)) {
      els.emailGate.classList.add('invalid');
      els.emailGateError.textContent = 'Enter a valid email address to continue.';
      els.customerEmail.focus();
      return;
    }
    state.customerEmail = normalizeEmail(email);
    localStorage.setItem(EMAIL_STORAGE_KEY, state.customerEmail);
    renderSessionEmail();
    els.emailGate.classList.add('hidden');
    els.emailGateError.textContent = '';
    setStatus('Ready');
    refreshProjectLog();
  });
  els.customerEmail.addEventListener('input', () => {
    els.emailGate.classList.remove('invalid');
    els.emailGateError.textContent = '';
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function renderSessionEmail() {
  if (!els.sessionEmailStat) return;
  els.sessionEmailStat.textContent = state.customerEmail || 'No email';
}

function setupAdminMode() {
  state.isAdmin = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  renderAdminMode();
  els.adminLoginButton?.addEventListener('click', () => {
    if (state.isAdmin) {
      logoutAdmin();
      return;
    }
    openAdminGate();
  });
  els.adminCancel?.addEventListener('click', closeAdminGate);
  els.adminGateForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await loginAdmin();
  });
  els.adminPassword?.addEventListener('input', () => {
    els.adminGate?.classList.remove('invalid');
    if (els.adminGateError) els.adminGateError.textContent = '';
  });
}

function setupViewportUnits() {
  updateViewportUnits();
  window.addEventListener('resize', updateViewportUnits);
  window.visualViewport?.addEventListener('resize', updateViewportUnits);
  window.visualViewport?.addEventListener('scroll', updateViewportUnits);
}

function updateViewportUnits() {
  const height = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty('--app-vh', `${height}px`);
}

function renderAdminMode() {
  if (els.adminLoginButton) {
    els.adminLoginButton.textContent = state.isAdmin ? 'Admin: Logout' : 'Login';
    els.adminLoginButton.classList.toggle('active', state.isAdmin);
  }
  renderProjectLog();
}

function openAdminGate() {
  if (!els.adminGate || !els.adminPassword) return;
  els.adminGate.classList.remove('hidden', 'invalid');
  if (els.adminGateError) els.adminGateError.textContent = '';
  els.adminPassword.value = '';
  window.setTimeout(() => els.adminPassword.focus(), 0);
}

function closeAdminGate() {
  els.adminGate?.classList.add('hidden');
}

async function loginAdmin() {
  const password = els.adminPassword?.value || '';
  if (!password.trim()) {
    showAdminLoginError('Enter the admin password.');
    return;
  }
  try {
    const ok = await verifyAdminPassword(password);
    if (!ok) {
      showAdminLoginError('Incorrect admin password.');
      return;
    }
    state.isAdmin = true;
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    closeAdminGate();
    renderAdminMode();
    setStatus('Admin mode');
  } catch (error) {
    console.error(error);
    showAdminLoginError('Admin login is unavailable.');
  }
}

function logoutAdmin() {
  state.isAdmin = false;
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  renderAdminMode();
  setStatus('Ready');
}

function showAdminLoginError(message) {
  els.adminGate?.classList.add('invalid');
  if (els.adminGateError) els.adminGateError.textContent = message;
  els.adminPassword?.focus();
}

async function verifyAdminPassword(password) {
  if (isLocalTesting()) {
    const localPassword = window.SIGN_GUY_LOCAL_ADMIN_PASSWORD || LOCAL_ADMIN_PASSWORD;
    return password === localPassword;
  }
  const endpoint = getAdminLoginEndpoint();
  if (!endpoint) return false;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return response.ok;
}

function getAdminLoginEndpoint() {
  if (window.SIGN_GUY_ADMIN_LOGIN_ENDPOINT) return window.SIGN_GUY_ADMIN_LOGIN_ENDPOINT;
  if (!window.location.protocol.startsWith('http')) return '';
  return new URL('/api/admin-login', window.location.href).href;
}

function renderUploadControl() {
  if (!els.chooseFileText) return;
  els.chooseFileText.textContent = state.uploadedFile ? 'Choose a different logo' : 'Upload logo';
}

function setupDropZone() {
  ['dragenter', 'dragover'].forEach((eventName) => {
    els.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      els.dropZone.classList.add('dragging');
    });
  });
  ['dragleave', 'drop'].forEach((eventName) => {
    els.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      els.dropZone.classList.remove('dragging');
    });
  });
  els.dropZone.addEventListener('drop', (event) => handleFiles(event.dataTransfer.files));
}

function setupDragRotation() {
  let dragging = false;
  let start = null;
  els.stage.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button, label, input, .preview-alert')) return;
    event.preventDefault();
    dragging = true;
    start = { x: event.clientX, y: event.clientY, rx: state.rotation.x, ry: state.rotation.y };
    els.stage.setPointerCapture(event.pointerId);
  });
  els.stage.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    event.preventDefault();
    state.rotation.x = clamp(start.rx - (event.clientY - start.y) * 0.24, -58, 58);
    state.rotation.y = start.ry + (event.clientX - start.x) * 0.42;
    applyRotation();
  });
  const stopDrag = () => {
    dragging = false;
  };
  els.stage.addEventListener('pointerup', stopDrag);
  els.stage.addEventListener('pointercancel', stopDrag);
  els.stage.addEventListener('lostpointercapture', stopDrag);
}

async function handleFiles(fileList) {
  const file = fileList?.[0];
  if (!file) return;
  const isSvg = file.type.includes('svg') || file.name.toLowerCase().endsWith('.svg');
  const isPng = file.type.includes('png') || file.name.toLowerCase().endsWith('.png');
  if (!isSvg && !isPng) {
    setStatus('Unsupported');
    setWarnings([{ level: 'error', text: 'Please upload an SVG or PNG file.' }]);
    return;
  }

  setStatus('Importing');
  state.isDefaultPreview = false;
  state.fileName = file.name;
  state.designName = '';
  els.designName.value = '';
  state.uploadedFile = file;
  renderUploadControl();
  state.projectId = null;
  try {
    state.artwork = isSvg ? await readSvgArtwork(file) : await readPngArtwork(file);
    state.removeBg = state.artwork.hasTransparency ? false : true;
    els.removeBg.checked = state.removeBg;
    state.targetColorCount = 8;
    state.colorOverrides = [];
    state.frontColoursCustomized = false;
    state.selectedColor = 0;
    state.selectedColourTarget = { type: 'front', index: 0 };
    state.previewZoom = 1;
    state.dismissedPreviewAlert = '';
    resetRotation();
    initEditState();
    await reprocess();
    openWizard('edit');
  } catch (error) {
    console.error(error);
    setStatus('Import failed');
    setWarnings([{ level: 'error', text: error.message || 'The artwork could not be imported.' }]);
  }
}

async function readSvgArtwork(file) {
  const text = await file.text();
  const parser = new DOMParser();
  const documentSvg = parser.parseFromString(text, 'image/svg+xml');
  if (documentSvg.querySelector('parsererror')) throw new Error('The SVG could not be parsed.');
  const normalizedText = normalizeSvgForImage(documentSvg);
  const gradients = documentSvg.querySelectorAll('linearGradient, radialGradient').length;
  const pathCount = documentSvg.querySelectorAll('path, polygon, polyline, rect, circle, ellipse').length;
  const palette = extractSvgPalette(documentSvg);
  const blob = new Blob([normalizedText], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const image = await loadImage(url);
  URL.revokeObjectURL(url);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(normalizedText)}`;
  return { type: 'svg', image, dataUrl, pathCount, gradients, palette, hasTransparency: imageHasTransparency(image), name: file.name };
}

function normalizeSvgForImage(documentSvg) {
  const svg = documentSvg.documentElement;
  if (!svg) return new XMLSerializer().serializeToString(documentSvg);
  const width = parseSvgLength(svg.getAttribute('width'));
  const height = parseSvgLength(svg.getAttribute('height'));
  const viewBox = parseViewBox(svg.getAttribute('viewBox'));
  const fallbackWidth = viewBox ? Math.abs(viewBox[2]) : 1024;
  const fallbackHeight = viewBox ? Math.abs(viewBox[3]) : fallbackWidth;
  if (!width || !height) {
    svg.setAttribute('width', String(Math.max(1, Math.round(width || fallbackWidth))));
    svg.setAttribute('height', String(Math.max(1, Math.round(height || fallbackHeight))));
  }
  if (!svg.getAttribute('preserveAspectRatio')) {
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  return new XMLSerializer().serializeToString(documentSvg);
}

function parseSvgLength(value) {
  if (!value) return null;
  const match = String(value).trim().match(/^([0-9]*\.?[0-9]+)/);
  return match ? Number(match[1]) : null;
}

function parseViewBox(value) {
  if (!value) return null;
  const parts = String(value).trim().split(/[\s,]+/).map(Number);
  return parts.length === 4 && parts.every(Number.isFinite) ? parts : null;
}

async function readPngArtwork(file) {
  const url = URL.createObjectURL(file);
  const dataUrl = await readAsDataUrl(file);
  const image = await loadImage(url);
  URL.revokeObjectURL(url);
  return { type: 'png', image, dataUrl, pathCount: 0, gradients: 0, hasTransparency: imageHasTransparency(image), name: file.name };
}

function imageHasTransparency(image) {
  const canvas = document.createElement('canvas');
  const width = Math.min(80, image.naturalWidth);
  const height = Math.min(80, image.naturalHeight);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true;
  }
  return false;
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The image file could not be read.'));
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The file could not be read.'));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToFile(dataUrl, filename) {
  const blob = dataUrlToBlob(dataUrl);
  try {
    return new File([blob], filename || 'lightbox-logo', { type: blob.type || 'application/octet-stream' });
  } catch {
    blob.name = filename || 'lightbox-logo';
    return blob;
  }
}

function dataUrlToBlob(dataUrl) {
  const [header, payload = ''] = String(dataUrl).split(',');
  const mime = header.match(/^data:([^;,]+)/)?.[1] || 'application/octet-stream';
  const isBase64 = /;base64/i.test(header);
  const binary = isBase64 ? atob(payload) : decodeURIComponent(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function inferArtworkType(dataUrl, filename = '') {
  const raw = `${dataUrl} ${filename}`.toLowerCase();
  return raw.includes('image/svg') || raw.includes('.svg') ? 'svg' : 'png';
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The image could not be loaded.'));
    image.src = src;
  });
}

function extractSvgPalette(documentSvg) {
  const values = [];
  documentSvg.querySelectorAll('style').forEach((node) => {
    [...(node.textContent || '').matchAll(/(?:fill|stroke)\s*:\s*([^;}\n]+)/gi)].forEach((match) => values.push(match[1]));
  });
  documentSvg.querySelectorAll('*').forEach((node) => {
    ['fill', 'stroke'].forEach((attr) => {
      const value = node.getAttribute(attr);
      if (value) values.push(value);
    });
    const style = node.getAttribute('style') || '';
    [...style.matchAll(/(?:fill|stroke)\s*:\s*([^;]+)/gi)].forEach((match) => values.push(match[1]));
  });
  const colours = [];
  values.forEach((value) => {
    const rgb = parseCssColour(value);
    if (!rgb) return;
    if (!colours.some((colour) => colourDistance(colour, rgb) < 4)) colours.push(rgb);
  });
  return colours.slice(0, 24);
}

function parseCssColour(value) {
  const raw = value.trim().toLowerCase();
  if (!raw || raw === 'none' || raw === 'transparent' || raw === 'currentcolor' || raw.startsWith('url(')) return null;
  const canvas = parseCssColour.canvas || (parseCssColour.canvas = document.createElement('canvas').getContext('2d'));
  canvas.fillStyle = '#000000';
  canvas.fillStyle = raw;
  const normalized = canvas.fillStyle;
  const hex = normalized.startsWith('#') ? normalized : null;
  if (!hex || hex === '#000000' && raw !== '#000' && raw !== '#000000' && raw !== 'black' && !raw.startsWith('rgb(0')) return null;
  if (hex.length === 7) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }
  return null;
}

async function reprocess(options = {}) {
  if (!state.artwork) return;
  setStatus('Processing');
  await waitFrame();
  state.processed = processArtwork(state.artwork);
  if (!options.preserveTargetColorCount && !state.frontColoursCustomized && state.processed.naturalColourCount) {
    state.targetColorCount = state.processed.naturalColourCount;
  }
  syncColorOverrides();
  renderPreview();
  renderDiagnostics();
  if (els.submitDesign) els.submitDesign.disabled = state.isDefaultPreview || !state.uploadedFile;
  updateProjectControls();
  setStatus('Ready');
  if (state.wizardStep) renderWizardStep();
}

async function loadDefaultPreview() {
  try {
    const defaultType = 'svg';
    state.isDefaultPreview = true;
    state.uploadedFile = null;
    state.projectId = null;
    state.fileName = '';
    renderUploadControl();
    const image = await loadImage(DEFAULT_PREVIEW_DATA_URL);
    const artwork = {
      type: defaultType,
      image,
      dataUrl: DEFAULT_PREVIEW_DATA_URL,
      pathCount: 0,
      gradients: 0,
      palette: null,
      hasTransparency: true,
      name: 'Sign Guy logo example',
    };
    state.artwork = artwork;
    state.removeBg = artwork.hasTransparency ? false : true;
    els.removeBg.checked = state.removeBg;
    state.targetColorCount = 8;
    state.colorOverrides = [];
    state.frontColoursCustomized = false;
    state.selectedColor = 0;
    state.selectedColourTarget = { type: 'front', index: 0 };
    state.previewZoom = 1;
    state.dismissedPreviewAlert = '';
    resetRotation();
    state.rotation = { x: 0, y: -18, z: 0 };
    initEditState();
    state.processed = processArtwork(artwork);
    if (state.processed.naturalColourCount) state.targetColorCount = state.processed.naturalColourCount;
    syncColorOverrides();
    renderPreview();
    renderDiagnostics();
    if (els.submitDesign) els.submitDesign.disabled = true;
    updateProjectControls();
    setStatus('Ready');
  } catch (error) {
    console.error(error);
    state.isDefaultPreview = true;
    state.fileName = '';
    renderUploadControl();
    renderPreviewTitle();
    renderEmptyPreview();
  } finally {
    setLoadingProgress(92);
  }
}

function initEditState() {
  state.edit = {
    crop: detectDefaultCrop(state.artwork),
    cropAspect: 'free',
    zoom: 1,
  };
}

function detectDefaultCrop(artwork) {
  const width = Math.min(220, artwork.image.naturalWidth);
  const height = Math.min(220, artwork.image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(artwork.image, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  const bg = averageCornerColour(data, width, height);
  const backgroundMask = state.removeBg ? buildConnectedBackgroundMask(data, width, height, bg, state.tolerance) : null;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const index = y * width + x;
      const visible = data[i + 3] > 32 && (!backgroundMask || !backgroundMask[index]);
      if (!visible) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w: 1, h: 1 };
  const padX = width * 0.035;
  const padY = height * 0.035;
  minX = clamp(minX - padX, 0, width);
  minY = clamp(minY - padY, 0, height);
  maxX = clamp(maxX + padX, 0, width);
  maxY = clamp(maxY + padY, 0, height);
  return {
    x: minX / width,
    y: minY / height,
    w: Math.max(0.08, (maxX - minX) / width),
    h: Math.max(0.08, (maxY - minY) / height),
  };
}

function openWizard(step) {
  state.wizardStep = step;
  document.body.classList.add('wizard-open');
  updateViewportUnits();
  els.wizard.classList.remove('hidden');
  els.wizard.setAttribute('aria-hidden', 'false');
  renderWizardStep();
}

function closeWizard() {
  state.wizardStep = null;
  closeColourPopover();
  document.body.classList.remove('wizard-open');
  els.wizard.classList.add('hidden');
  els.wizard.setAttribute('aria-hidden', 'true');
}

function renderWizardStep() {
  if (!state.wizardStep || !state.artwork) return;
  closeColourPopover();
  if (state.wizardStep === 'edit') renderEditStep();
  if (state.wizardStep === 'vector') renderVectorStep();
  if (state.wizardStep === 'mapping') renderMappingStep();
  if (state.wizardStep === 'details') renderDetailsStep();
}

function renderEditStep() {
  els.wizardTitle.textContent = 'Edit Your Image';
  els.wizardImage.onload = () => updateCropBox();
  els.wizardImage.src = renderEditArtworkPreviewUrl(state.artwork);
  els.wizardImage.style.setProperty('--wizard-zoom', state.edit.zoom);
  els.cropBox.classList.add('visible');
  els.cropBox.classList.toggle('circle', state.edit.cropAspect === 'circle');
  els.previewTools.classList.remove('hidden');
  els.wizardSide.innerHTML = `
    <h3>Crop</h3>
    <div class="crop-presets">
      ${CROP_PRESETS.map((preset) => `
        <button class="crop-preset ${state.edit.cropAspect === preset.id ? 'active' : ''}" type="button" data-crop-preset="${preset.id}">
          <span class="crop-icon ${preset.icon}"></span>
          <span>${preset.label}</span>
        </button>
      `).join('')}
    </div>
    <label class="switch-row">
      <span>Remove Background</span>
      <input id="wizardRemoveBg" type="checkbox" ${state.removeBg ? 'checked' : ''} />
    </label>
  `;
  els.wizardFooter.innerHTML = `
    <button class="secondary-button" type="button" data-wizard-action="cancel">Cancel</button>
    <button class="primary-button" type="button" data-wizard-action="to-vector">Next</button>
  `;
  bindWizardButtons();
  requestAnimationFrame(updateCropBox);
}

function renderEditArtworkPreviewUrl(artwork) {
  if (!artwork || !state.removeBg) return artwork?.dataUrl || '';
  const crop = { x: 0, y: 0, w: 1, h: 1 };
  return renderBackgroundRemovedCanvas(artwork, crop, 1200).toDataURL('image/png');
}

function renderBackgroundRemovedCanvas(artwork, crop, maxSide) {
  const srcX = Math.round(artwork.image.naturalWidth * crop.x);
  const srcY = Math.round(artwork.image.naturalHeight * crop.y);
  const srcW = Math.max(1, Math.round(artwork.image.naturalWidth * crop.w));
  const srcH = Math.max(1, Math.round(artwork.image.naturalHeight * crop.h));
  const scale = maxSide / Math.max(srcW, srcH);
  const width = Math.max(12, Math.round(srcW * scale));
  const height = Math.max(12, Math.round(srcH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(artwork.image, srcX, srcY, srcW, srcH, 0, 0, width, height);
  const img = ctx.getImageData(0, 0, width, height);
  removeConnectedBackgroundFromImageData(img.data, width, height);
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function renderVectorStep() {
  els.wizardTitle.textContent = 'Vectorized Result';
  setWizardPreview(renderMappedArtworkUrl(state.processed) || state.processed?.artworkUrl || state.artwork.dataUrl);
  els.wizardSide.innerHTML = `
    <h3>Vectorized result</h3>
    <p>The artwork has been flattened into printable colour regions and a custom outer silhouette. If this does not look right, try again or go back to crop/background cleanup.</p>
    <div class="detail-list">
      <div class="detail-row"><span class="map-number">${state.processed?.colours.length || 0}</span><span>detected colours</span><strong>max 8</strong></div>
      <div class="detail-row"><span class="map-number">${state.tolerance}</span><span>merge tolerance</span><strong>auto</strong></div>
    </div>
  `;
  els.wizardFooter.innerHTML = `
    <button class="secondary-button" type="button" data-wizard-action="to-edit">Back</button>
    <button class="secondary-button" type="button" data-wizard-action="try-vector">Try Again</button>
    <button class="primary-button" type="button" data-wizard-action="to-mapping">Next</button>
  `;
  bindWizardButtons();
}

function renderMappingStep() {
  els.wizardTitle.textContent = 'Auto Color Mapping';
  setWizardPreview(renderMappedArtworkUrl(state.processed) || state.processed?.artworkUrl || state.artwork.dataUrl);
  const colours = state.processed?.colours || [];
  els.wizardSide.innerHTML = `
    <h3>Color Count</h3>
    <p>Adjust the number of colours to match your filaments. You can edit colours manually in the next step.</p>
    <div class="colour-count-row">
      <input id="mapColorCount" type="range" min="1" max="8" value="${state.targetColorCount}" />
      <span class="count-badge">${state.targetColorCount}</span>
    </div>
    <h3>Mapping</h3>
    <div class="mapping-list">
      ${colours.map((region, idx) => {
        const hex = getDisplayColour(idx, region.hex);
        return `
          <div class="mapping-row">
            <span class="map-dot" style="background:${region.hex}"></span>
            <span>-></span>
            <span class="map-number">${idx + 1}</span>
            <span class="colour-dot" style="background:${hex}"></span>
            <span class="map-number dark">${idx + 1}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
  els.wizardFooter.innerHTML = `
    <button class="secondary-button" type="button" data-wizard-action="to-vector">Back</button>
    <button class="primary-button" type="button" data-wizard-action="to-details">Next</button>
  `;
  bindWizardButtons();
  const colorCount = document.querySelector('#mapColorCount');
  const colorCountBadge = els.wizardSide.querySelector('.count-badge');
  colorCount.addEventListener('input', async () => {
    state.targetColorCount = Number(colorCount.value);
    if (colorCountBadge) colorCountBadge.textContent = String(state.targetColorCount);
    state.colorOverrides = [];
    state.frontColoursCustomized = true;
    await reprocess();
  });
}

function renderDetailsStep() {
  els.wizardTitle.textContent = 'Edit Color Details';
  setWizardPreview(renderMappedArtworkUrl(state.processed) || state.processed?.artworkUrl || state.artwork.dataUrl);
  const colours = state.processed?.colours || [];
  els.wizardSide.innerHTML = `
    <div class="section-heading">
      <h3>Colors</h3>
      <button class="icon-button" type="button" data-wizard-action="add-colour" aria-label="Add colour">+</button>
    </div>
    <p>Being used:</p>
    <div class="colour-chips">
      ${colours.map((region, idx) => `
        <button class="colour-chip ${state.selectedColor === idx ? 'active' : ''}" type="button" data-select-colour="${idx}">${idx + 1}</button>
      `).join('')}
    </div>
    <div class="section-heading">
      <h3>Mapping</h3>
      <button class="reset-button" type="button" data-wizard-action="reset-colours">Reset mapping</button>
    </div>
    <div class="detail-list">
      ${colours.map((region, idx) => {
        const hex = getDisplayColour(idx, region.hex);
        return `
          <div class="detail-row">
            <button class="colour-dot" type="button" data-edit-colour="${idx}" style="background:${hex}" aria-label="Edit colour ${idx + 1}"></button>
            <span>Colour ${idx + 1}</span>
            <strong>${hex}</strong>
          </div>
        `;
      }).join('')}
    </div>
    <div class="section-heading plate-detail-heading">
      <h3>Back and Sides</h3>
    </div>
    <div class="detail-list">
      <div class="detail-row">
        <button class="colour-dot" type="button" data-edit-shell="side" style="background:${state.shellColours.side}" aria-label="Edit side colour"></button>
        <span>Side wall</span>
        <strong>${normalizeHex(state.shellColours.side)}</strong>
      </div>
      <div class="detail-row">
        <button class="colour-dot" type="button" data-edit-shell="back" style="background:${state.shellColours.back}" aria-label="Edit back colour"></button>
        <span>Back plate</span>
        <strong>${normalizeHex(state.shellColours.back)}</strong>
      </div>
    </div>
  `;
  els.wizardFooter.innerHTML = `
    <button class="secondary-button" type="button" data-wizard-action="to-mapping">Back</button>
    <button class="primary-button" type="button" data-wizard-action="confirm">Confirm</button>
  `;
  bindWizardButtons();
}

function setWizardPreview(src) {
  els.wizardImage.onload = null;
  els.wizardImage.src = src;
  els.wizardImage.style.setProperty('--wizard-zoom', state.edit.zoom);
  els.cropBox.classList.remove('visible', 'circle');
  els.previewTools.classList.remove('hidden');
}

function bindWizardButtons() {
  els.wizardSide.querySelectorAll('[data-crop-preset]').forEach((button) => {
    button.addEventListener('click', () => setCropPreset(button.dataset.cropPreset));
  });
  els.wizardSide.querySelector('#wizardRemoveBg')?.addEventListener('change', async (event) => {
    state.removeBg = event.target.checked;
    els.removeBg.checked = state.removeBg;
    state.edit.crop = detectDefaultCrop(state.artwork);
    await reprocess();
    renderEditStep();
  });
  [...els.wizardFooter.querySelectorAll('[data-wizard-action]'), ...els.wizardSide.querySelectorAll('[data-wizard-action]')].forEach((button) => {
    button.addEventListener('click', () => handleWizardAction(button.dataset.wizardAction));
  });
  els.wizardSide.querySelectorAll('[data-select-colour]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedColor = Number(button.dataset.selectColour);
      renderDetailsStep();
    });
  });
  els.wizardSide.querySelectorAll('[data-edit-colour]').forEach((button) => {
    button.addEventListener('click', () => openColourPopover(Number(button.dataset.editColour), button));
  });
  els.wizardSide.querySelectorAll('[data-edit-shell]').forEach((button) => {
    button.addEventListener('click', () => openShellColourPopover(button.dataset.editShell, button));
  });
}

async function handleWizardAction(action) {
  if (action === 'cancel') closeWizard();
  if (action === 'to-edit') openWizard('edit');
  if (action === 'to-vector') {
    await reprocess();
    openWizard('vector');
  }
  if (action === 'try-vector') {
    state.tolerance = clamp(state.tolerance + 8, 18, 90);
    await reprocess();
    openWizard('vector');
  }
  if (action === 'to-mapping') openWizard('mapping');
  if (action === 'to-details') openWizard('details');
  if (action === 'reset-colours') {
    state.colorOverrides = [];
    state.frontColoursCustomized = false;
    renderPreview();
    renderShellColourControls();
    renderDetailsStep();
  }
  if (action === 'add-colour') {
    state.targetColorCount = clamp(state.targetColorCount + 1, 1, 8);
    state.frontColoursCustomized = true;
    await reprocess();
    openWizard('details');
  }
  if (action === 'confirm') closeWizard();
}

function setCropPreset(id) {
  const preset = CROP_PRESETS.find((item) => item.id === id);
  if (!preset) return;
  state.edit.cropAspect = id;
  if (preset.ratio) {
    const imageRatio = state.artwork.image.naturalWidth / state.artwork.image.naturalHeight;
    let w = 1;
    let h = 1;
    if (imageRatio > preset.ratio) {
      w = preset.ratio / imageRatio;
    } else {
      h = imageRatio / preset.ratio;
    }
    state.edit.crop = { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
  }
  renderEditStep();
}

function setupCropInteraction() {
  let drag = null;
  els.cropBox.addEventListener('pointerdown', (event) => {
    if (state.wizardStep !== 'edit') return;
    event.preventDefault();
    const rect = getDisplayedImageRect();
    const handle = event.target.dataset.handle || 'move';
    drag = {
      handle,
      startX: event.clientX,
      startY: event.clientY,
      crop: { ...state.edit.crop },
      rect,
    };
    els.cropBox.setPointerCapture(event.pointerId);
  });
  els.cropBox.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const dx = (event.clientX - drag.startX) / drag.rect.width;
    const dy = (event.clientY - drag.startY) / drag.rect.height;
    let crop = { ...drag.crop };
    if (drag.handle === 'move') {
      crop.x += dx;
      crop.y += dy;
    } else {
      if (drag.handle.includes('e')) crop.w += dx;
      if (drag.handle.includes('s')) crop.h += dy;
      if (drag.handle.includes('w')) {
        crop.x += dx;
        crop.w -= dx;
      }
      if (drag.handle.includes('n')) {
        crop.y += dy;
        crop.h -= dy;
      }
      crop = enforceCropAspect(crop, drag.handle);
    }
    state.edit.crop = normalizeCrop(crop);
    updateCropBox();
  });
  els.cropBox.addEventListener('pointerup', () => {
    drag = null;
  });
  window.addEventListener('resize', updateCropBox);
}

function enforceCropAspect(crop, handle) {
  const preset = CROP_PRESETS.find((item) => item.id === state.edit.cropAspect);
  if (!preset?.ratio) return crop;
  const naturalRatio = state.artwork.image.naturalWidth / state.artwork.image.naturalHeight;
  const targetH = (crop.w * naturalRatio) / preset.ratio;
  if (handle.includes('n')) crop.y += crop.h - targetH;
  crop.h = targetH;
  return crop;
}

function normalizeCrop(crop) {
  const min = 0.06;
  crop.w = clamp(crop.w, min, 1);
  crop.h = clamp(crop.h, min, 1);
  crop.x = clamp(crop.x, 0, 1 - crop.w);
  crop.y = clamp(crop.y, 0, 1 - crop.h);
  return crop;
}

function getDisplayedImageRect() {
  const imageRect = els.wizardImage.getBoundingClientRect();
  const boardRect = els.wizardArtboard.getBoundingClientRect();
  return {
    left: imageRect.left - boardRect.left,
    top: imageRect.top - boardRect.top,
    width: imageRect.width,
    height: imageRect.height,
  };
}

function updateCropBox() {
  if (state.wizardStep !== 'edit' || !state.artwork) return;
  const rect = getDisplayedImageRect();
  const crop = state.edit.crop;
  els.cropBox.style.left = `${rect.left + crop.x * rect.width}px`;
  els.cropBox.style.top = `${rect.top + crop.y * rect.height}px`;
  els.cropBox.style.width = `${crop.w * rect.width}px`;
  els.cropBox.style.height = `${crop.h * rect.height}px`;
}

function setWizardZoom(value) {
  state.edit.zoom = clamp(value, 0.7, 1.8);
  els.wizardImage.style.setProperty('--wizard-zoom', state.edit.zoom);
  requestAnimationFrame(updateCropBox);
}

function syncColorOverrides() {
  if (!state.processed) return;
  state.colorOverrides = state.processed.colours.map((region, idx) => normalizeHex(state.colorOverrides[idx] || region.hex));
  state.selectedColor = clamp(state.selectedColor, 0, Math.max(0, state.processed.colours.length - 1));
}

function getDisplayColour(index, fallback) {
  return normalizeHex(state.colorOverrides[index] || fallback || '#ffffff');
}

function renderMappedArtworkUrl(processed) {
  if (!processed?.colours.length) return processed?.artworkUrl || '';
  if (!state.frontColoursCustomized) return processed.artworkUrl || '';
  const canvas = document.createElement('canvas');
  canvas.width = processed.width;
  canvas.height = processed.height;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(processed.width, processed.height);
  const displayColours = processed.colours.map((region, idx) => hexToRgb(getDisplayColour(idx, region.hex)));
  for (let i = 0; i < processed.regionIndex.length; i += 1) {
    const region = processed.regionIndex[i];
    const o = i * 4;
    if (!processed.alphaMask[i] || region < 0 || !displayColours[region]) {
      img.data[o + 3] = 0;
      continue;
    }
    const rgb = displayColours[region];
    img.data[o] = rgb[0];
    img.data[o + 1] = rgb[1];
    img.data[o + 2] = rgb[2];
    img.data[o + 3] = processed.alphaValues?.[i] || 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}

function buildPresetGrid() {
  els.presetGrid.innerHTML = PRESET_COLOURS.map((hex) => `<button type="button" data-preset-colour="${hex}" style="background:${hex}" aria-label="${hex}"></button>`).join('');
  els.presetGrid.querySelectorAll('[data-preset-colour]').forEach((button) => {
    button.addEventListener('click', () => applySelectedColour(button.dataset.presetColour));
  });
}

function openColourPopover(index, anchor) {
  openFrontColourPopover(index, anchor);
}

function openFrontColourPopover(index, anchor) {
  state.selectedColourTarget = { type: 'front', index };
  state.selectedColor = index;
  const hex = getDisplayColour(index, state.processed?.colours[index]?.hex);
  updatePopoverInputs(hex);
  const rect = anchor.getBoundingClientRect();
  els.colourPopover.style.left = `${Math.min(window.innerWidth - 275, rect.left + 8)}px`;
  els.colourPopover.style.top = `${Math.min(window.innerHeight - 360, rect.bottom + 8)}px`;
  els.colourPopover.classList.remove('hidden');
  setPopoverTab('preset');
}

function openShellColourPopover(part, anchor) {
  state.selectedColourTarget = { type: 'shell', part };
  const hex = normalizeHex(state.shellColours[part]);
  updatePopoverInputs(hex);
  const rect = anchor.getBoundingClientRect();
  els.colourPopover.style.left = `${Math.min(window.innerWidth - 275, rect.left + 8)}px`;
  els.colourPopover.style.top = `${Math.min(window.innerHeight - 360, rect.bottom + 8)}px`;
  els.colourPopover.classList.remove('hidden');
  setPopoverTab('preset');
}

function closeColourPopover() {
  els.colourPopover.classList.add('hidden');
}

function setPopoverTab(tab) {
  document.querySelectorAll('[data-popover-tab]').forEach((button) => {
    button.classList.toggle('active', button.dataset.popoverTab === tab);
  });
  els.presetPane.classList.toggle('hidden', tab !== 'preset');
  els.customPane.classList.toggle('hidden', tab !== 'custom');
}

function updatePopoverInputs(hex) {
  const normalized = normalizeHex(hex);
  const rgb = hexToRgb(normalized);
  els.popoverSwatch.style.background = normalized;
  els.popoverHex.value = normalized;
  els.customColourInput.value = normalized;
  els.rgbR.value = rgb[0];
  els.rgbG.value = rgb[1];
  els.rgbB.value = rgb[2];
}

function applySelectedColour(hex) {
  const normalized = normalizeHex(hex);
  if (state.selectedColourTarget.type === 'shell') {
    state.shellColours[state.selectedColourTarget.part] = normalized;
    renderShellColourControls();
  } else {
    state.colorOverrides[state.selectedColor] = normalized;
    state.frontColoursCustomized = true;
  }
  updatePopoverInputs(normalized);
  renderPreview();
  if (state.wizardStep === 'details') renderDetailsStep();
  if (state.wizardStep === 'mapping') renderMappingStep();
}

function applyRgbInputs() {
  const rgb = [els.rgbR, els.rgbG, els.rgbB].map((input) => clamp(Number(input.value) || 0, 0, 255));
  applySelectedColour(rgbToHex(rgb));
}

function initThreeStage() {
  if (!window.THREE) return;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.domElement.className = 'three-canvas';
  els.stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 1, 1200);
  camera.position.set(0, 10, 430);
  camera.lookAt(0, 0, 0);

  const hemi = new THREE.HemisphereLight(0xdde6ef, 0x121312, 1.35);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.45);
  key.position.set(-180, 260, 310);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x6f85a6, 0.75);
  rim.position.set(220, 100, -240);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(720, 420),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.34 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -105, -40);
  floor.receiveShadow = true;
  scene.add(floor);

  state.three = { renderer, scene, camera, floor, group: null, resources: [], resizeObserver: null };
  resizeThree();
  window.addEventListener('resize', resizeThree);
  if (window.ResizeObserver) {
    state.three.resizeObserver = new ResizeObserver(() => resizeThree());
    state.three.resizeObserver.observe(els.stage);
  }
  renderThree();
}

function resizeThree() {
  if (!state.three) return;
  const rect = els.stage.getBoundingClientRect();
  state.three.renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
  state.three.camera.aspect = Math.max(1, rect.width) / Math.max(1, rect.height);
  applyPreviewZoom();
  updateThreeModelPosition();
  state.three.camera.updateProjectionMatrix();
  renderThree();
}

function renderThree() {
  if (!state.three) return;
  state.three.renderer.render(state.three.scene, state.three.camera);
}

function applyIllumination() {
  els.stage.classList.toggle('lights-on', state.illuminated);
  els.stage.classList.toggle('lights-off', !state.illuminated);
  if (els.lightToggleLabel) els.lightToggleLabel.textContent = state.illuminated ? 'lights on' : 'lights off';
}

function setPreviewZoom(value) {
  state.previewZoom = clamp(Number(value) || 1, 0.55, 2.4);
  applyPreviewZoom();
  renderThree();
}

function applyPreviewZoom() {
  const zoom = clamp(Number(state.previewZoom) || 1, 0.55, 2.4);
  state.previewZoom = zoom;
  if (els.previewZoomReset) els.previewZoomReset.textContent = `${Math.round(zoom * 100)}%`;
  if (state.three?.camera) {
    state.three.camera.position.z = 430 / zoom;
    state.three.camera.lookAt(0, 0, 0);
    state.three.camera.updateProjectionMatrix();
  }
  if (els.modelStack) {
    els.modelStack.style.scale = zoom.toFixed(3);
  }
}

function clearThreeModel() {
  if (!state.three?.group) return;
  state.three.scene.remove(state.three.group);
  state.three.resources.forEach((resource) => {
    if (resource?.dispose) resource.dispose();
  });
  state.three.group = null;
  state.three.resources = [];
  renderThree();
}

function updateThreeModelPosition() {
  if (!state.three?.group) return;
  state.three.group.position.y = getThreeModelYOffset();
}

function getThreeModelYOffset() {
  return isResponsiveViewport() ? -26 : 10;
}

function isResponsiveViewport() {
  return window.matchMedia('(max-width: 880px)').matches;
}

function buildThreeModel() {
  if (!state.three || !state.processed || !window.THREE) return;
  clearThreeModel();
  const processed = state.processed;
  const shellDepth = SIZE_PRESETS[state.size].depth;
  const bounds = getModelBounds(processed);
  const facePoints = silhouetteToThreePoints(processed.silhouette, bounds, 1);
  const frontBackerPoints = offsetThreePolygon(facePoints, 0.45);
  const bezelInnerPoints = offsetThreePolygon(facePoints, 0.15);
  const shellOuterPoints = offsetThreePolygon(facePoints, 1.05);
  const backPoints = offsetThreePolygon(facePoints, 1.05);
  const faceShape = makeThreeShape(facePoints);
  const frontBackerShape = makeThreeShape(frontBackerPoints);
  const sideColour = normalizeHex(state.shellColours.side);
  const backColour = normalizeHex(state.shellColours.back);
  const resources = state.three.resources;

  const group = new THREE.Group();
  group.position.y = getThreeModelYOffset();

  const sideMaterial = new THREE.MeshStandardMaterial({
    color: makeThreeColour(sideColour),
    roughness: 0.78,
    metalness: 0.05,
  });
  const backMaterial = new THREE.MeshStandardMaterial({
    color: makeThreeColour(backColour),
    roughness: 0.86,
    metalness: 0.04,
  });
  const frontBackerMaterial = new THREE.MeshStandardMaterial({
    color: makeThreeColour(sideColour),
    roughness: 0.82,
    metalness: 0.05,
  });
  const keyholeShadowMaterial = new THREE.MeshBasicMaterial({
    color: makeThreeColour('#050505'),
    side: THREE.DoubleSide,
  });
  resources.push(sideMaterial, backMaterial, frontBackerMaterial, keyholeShadowMaterial);

  const shellGeometry = new THREE.ExtrudeBufferGeometry(makeThreeShape(shellOuterPoints), {
    depth: shellDepth,
    bevelEnabled: true,
    bevelSize: 0.22,
    bevelThickness: 0.22,
    bevelSegments: 2,
    curveSegments: 2,
  });
  shellGeometry.translate(0, 0, -shellDepth);
  shellGeometry.computeVertexNormals();
  const shell = new THREE.Mesh(shellGeometry, [sideMaterial, sideMaterial]);
  shell.castShadow = true;
  shell.receiveShadow = true;
  group.add(shell);
  resources.push(shellGeometry);

  const shellBounds = getThreePointBounds(backPoints);
  const keyholeAnchor = getBackPlateKeyholeAnchor(processed, bounds) || { x: shellBounds.centerX, y: shellBounds.centerY };
  const keyholeBounds = {
    ...bounds,
    keyholeX: keyholeAnchor.x,
    keyholeY: keyholeAnchor.y,
  };

  const backLipGeometry = new THREE.ExtrudeBufferGeometry(makeBackPlateShape(backPoints, keyholeBounds), {
    depth: 2.8,
    bevelEnabled: true,
    bevelSize: 0.26,
    bevelThickness: 0.26,
    bevelSegments: 2,
  });
  backLipGeometry.translate(0, 0, -shellDepth - 2.8);
  const backPlate = new THREE.Mesh(backLipGeometry, backMaterial);
  backPlate.castShadow = true;
  backPlate.receiveShadow = true;
  group.add(backPlate);
  resources.push(backLipGeometry);

  const keyholeShadowGeometry = new THREE.ShapeBufferGeometry(makeKeyholeCutoutShape(keyholeBounds, 1.18));
  const keyholeShadow = new THREE.Mesh(keyholeShadowGeometry, keyholeShadowMaterial);
  keyholeShadow.position.z = -shellDepth - 2.86;
  group.add(keyholeShadow);
  resources.push(keyholeShadowGeometry);

  const frontBackerGeometry = new THREE.ShapeBufferGeometry(frontBackerShape);
  const frontBacker = new THREE.Mesh(frontBackerGeometry, frontBackerMaterial);
  frontBacker.position.z = 1.45;
  frontBacker.renderOrder = 1;
  frontBacker.castShadow = true;
  frontBacker.receiveShadow = true;
  group.add(frontBacker);
  resources.push(frontBackerGeometry);

  const bezelGeometry = new THREE.ExtrudeBufferGeometry(makeThreeRingShape(shellOuterPoints, bezelInnerPoints), {
    depth: 3.2,
    bevelEnabled: true,
    bevelSize: 0.32,
    bevelThickness: 0.32,
    bevelSegments: 2,
    curveSegments: 2,
  });
  bezelGeometry.translate(0, 0, -0.35);
  bezelGeometry.computeVertexNormals();
  const bezel = new THREE.Mesh(bezelGeometry, sideMaterial);
  bezel.castShadow = true;
  bezel.receiveShadow = true;
  bezel.renderOrder = 2;
  group.add(bezel);
  resources.push(bezelGeometry);

  const artworkCanvas = state.frontColoursCustomized ? createMappedArtworkCanvas(processed) : processed.artworkCanvas;
  const texture = new THREE.CanvasTexture(artworkCanvas);
  texture.anisotropy = 8;
  texture.encoding = THREE.sRGBEncoding;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  resources.push(texture);

  const faceGeometry = new THREE.PlaneBufferGeometry(bounds.width, bounds.height);
  const faceMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xffffff,
    transparent: true,
    alphaTest: 0.03,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
  });
  const face = new THREE.Mesh(faceGeometry, faceMaterial);
  face.position.z = 3.15;
  face.renderOrder = 4;
  face.castShadow = true;
  face.receiveShadow = false;
  group.add(face);
  resources.push(faceGeometry, faceMaterial);

  const glowGeometry = new THREE.ShapeBufferGeometry(faceShape);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xdce8ff,
    transparent: true,
    opacity: state.illuminated ? 0.26 : 0.015,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.z = 3;
  glow.scale.set(1.015, 1.015, 1);
  glow.renderOrder = 3;
  group.add(glow);
  resources.push(glowGeometry, glowMaterial);

  const innerLight = new THREE.PointLight(0xd9e6ff, state.illuminated ? 1.15 : 0.04, 280);
  innerLight.position.set(0, 0, -8);
  group.add(innerLight);

  state.three.group = group;
  state.three.scene.add(group);
  els.stage.classList.add('three-active');
  applyRotation();
  renderThree();
  requestAnimationFrame(() => els.stage.classList.add('preview-ready'));
}

function getModelBounds(processed) {
  const maxWidth = 148;
  const maxHeight = 148;
  const width = processed.aspect >= 1 ? maxWidth : maxHeight * processed.aspect;
  const height = processed.aspect >= 1 ? maxWidth / processed.aspect : maxHeight;
  return { width, height, minX: -width / 2, maxX: width / 2, minY: -height / 2, maxY: height / 2 };
}

function getThreePointBounds(points) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

function getBackPlateKeyholeAnchor(processed, bounds) {
  if (!processed?.alphaMask || !processed.width || !processed.height) return null;
  const width = processed.width;
  const height = processed.height;
  const mask = processed.alphaMask;
  const rowCounts = new Uint32Array(height);
  let maxRowCount = 0;
  for (let y = 0; y < height; y += 1) {
    let count = 0;
    const rowStart = y * width;
    for (let x = 0; x < width; x += 1) {
      if (mask[rowStart + x]) count += 1;
    }
    rowCounts[y] = count;
    maxRowCount = Math.max(maxRowCount, count);
  }
  if (!maxRowCount) return null;

  const threshold = Math.max(8, Math.round(maxRowCount * 0.55));
  let best = null;
  let current = null;
  for (let y = 0; y <= height; y += 1) {
    const inBand = y < height && rowCounts[y] >= threshold;
    if (inBand && !current) current = { start: y, end: y, area: 0 };
    if (inBand && current) {
      current.end = y;
      current.area += rowCounts[y];
    }
    if ((!inBand || y === height) && current) {
      if (!best || current.area > best.area) best = current;
      current = null;
    }
  }
  if (!best) return null;

  let minX = width;
  let maxX = -1;
  let pixelCount = 0;
  let yTotal = 0;
  for (let y = best.start; y <= best.end; y += 1) {
    const rowStart = y * width;
    for (let x = 0; x < width; x += 1) {
      if (!mask[rowStart + x]) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      yTotal += y;
      pixelCount += 1;
    }
  }
  if (!pixelCount || maxX < minX) return null;

  const centerX = ((minX + maxX + 1) / 2 / width - 0.5) * bounds.width;
  const centerY = (0.5 - (yTotal / pixelCount + 0.5) / height) * bounds.height;
  return { x: centerX, y: centerY };
}

function getPreviewSvgSize(aspect) {
  const width = aspect >= 1 ? 1000 : 1000 * aspect;
  const height = aspect >= 1 ? 1000 / aspect : 1000;
  return { width, height };
}

function silhouetteToThreePoints(points, bounds, scale = 1) {
  return points.map(([x, y]) => new THREE.Vector2((x - 0.5) * bounds.width * scale, (0.5 - y) * bounds.height * scale));
}

function makeThreeShape(points) {
  const shape = new THREE.Shape();
  points.forEach((point, idx) => {
    if (idx === 0) shape.moveTo(point.x, point.y);
    else shape.lineTo(point.x, point.y);
  });
  shape.closePath();
  return shape;
}

function offsetThreePolygon(points, offset) {
  if (!window.THREE || points.length < 3 || !offset) return points.map((point) => point.clone());
  const area = polygonArea(points.map((point) => [point.x, point.y]));
  const normalSide = area >= 0 ? 1 : -1;
  return points.map((point, idx) => {
    const prev = points[(idx - 1 + points.length) % points.length];
    const next = points[(idx + 1) % points.length];
    const edgeIn = new THREE.Vector2(point.x - prev.x, point.y - prev.y);
    const edgeOut = new THREE.Vector2(next.x - point.x, next.y - point.y);
    if (edgeIn.lengthSq() < 0.0001 || edgeOut.lengthSq() < 0.0001) return point.clone();
    edgeIn.normalize();
    edgeOut.normalize();
    const normalIn = new THREE.Vector2(edgeIn.y * normalSide, -edgeIn.x * normalSide);
    const normalOut = new THREE.Vector2(edgeOut.y * normalSide, -edgeOut.x * normalSide);
    const lineA = point.clone().add(normalIn.multiplyScalar(offset));
    const lineB = point.clone().add(normalOut.multiplyScalar(offset));
    const intersection = intersectOffsetLines(prev.clone().add(normalIn), edgeIn, lineB, edgeOut);
    if (intersection && intersection.distanceTo(point) <= Math.abs(offset) * 3.2) return intersection;
    const averaged = lineA.clone().sub(point).add(lineB.clone().sub(point));
    if (averaged.lengthSq() < 0.0001) return lineA;
    return point.clone().add(averaged.normalize().multiplyScalar(offset));
  });
}

function intersectOffsetLines(pointA, directionA, pointB, directionB) {
  const cross = directionA.x * directionB.y - directionA.y * directionB.x;
  if (Math.abs(cross) < 0.0001) return null;
  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  const t = (dx * directionB.y - dy * directionB.x) / cross;
  return pointA.clone().add(directionA.clone().multiplyScalar(t));
}

function makeThreeRingShape(outerPoints, innerPoints) {
  const shape = makeThreeShape(outerPoints);
  const hole = new THREE.Path();
  [...innerPoints].reverse().forEach((point, idx) => {
    if (idx === 0) hole.moveTo(point.x, point.y);
    else hole.lineTo(point.x, point.y);
  });
  hole.closePath();
  shape.holes.push(hole);
  return shape;
}

function makeBackPlateShape(backPoints, bounds) {
  const shape = makeThreeShape(backPoints);
  shape.holes.push(makeKeyholeCutoutPath(bounds));
  return shape;
}

function makeKeyholeCutoutPath(bounds, visualScale = 1) {
  const centerX = Number.isFinite(bounds.keyholeX) ? bounds.keyholeX : 0;
  const centerY = Number.isFinite(bounds.keyholeY) ? bounds.keyholeY : 0;
  const lowerRadius = 4.5 * visualScale;
  const stemWidth = 5.16 * visualScale;
  const topRadius = stemWidth / 2;
  const centerGap = (15 - 4.5 - 2.58) * visualScale;
  const topY = centerY - (topRadius - centerGap - lowerRadius) / 2;
  const lowerY = topY - centerGap;
  const left = centerX - stemWidth / 2;
  const right = centerX + stemWidth / 2;
  const localRight = stemWidth / 2;
  const neckJoinY = lowerY + Math.sqrt(Math.max(0, lowerRadius * lowerRadius - localRight * localRight));
  const path = new THREE.Path();
  path.moveTo(left, topY);
  path.absarc(centerX, topY, topRadius, Math.PI, 0, true);
  path.lineTo(right, neckJoinY);
  path.absarc(centerX, lowerY, lowerRadius, Math.acos(localRight / lowerRadius), Math.PI - Math.acos(localRight / lowerRadius), true);
  path.lineTo(left, topY);
  path.closePath();
  return path;
}

function makeKeyholeCutoutShape(bounds, visualScale = 1) {
  const path = makeKeyholeCutoutPath(bounds, visualScale);
  const points = path.getPoints(28);
  const shape = new THREE.Shape();
  points.forEach((point, idx) => {
    if (idx === 0) shape.moveTo(point.x, point.y);
    else shape.lineTo(point.x, point.y);
  });
  shape.closePath();
  return shape;
}

function applyPlanarUvs(geometry, bounds) {
  const position = geometry.attributes.position;
  const uvs = [];
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    uvs.push((x - bounds.minX) / bounds.width, (y - bounds.minY) / bounds.height);
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
}

function createMappedArtworkCanvas(processed) {
  const canvas = document.createElement('canvas');
  canvas.width = processed.width;
  canvas.height = processed.height;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(processed.width, processed.height);
  const displayColours = processed.colours.map((region, idx) => hexToRgb(getDisplayColour(idx, region.hex)));
  for (let i = 0; i < processed.regionIndex.length; i += 1) {
    const region = processed.regionIndex[i];
    const o = i * 4;
    if (!processed.alphaMask[i] || region < 0 || !displayColours[region]) {
      img.data[o + 3] = 0;
      continue;
    }
    const rgb = displayColours[region];
    img.data[o] = rgb[0];
    img.data[o + 1] = rgb[1];
    img.data[o + 2] = rgb[2];
    img.data[o + 3] = processed.alphaValues?.[i] || 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function processArtwork(artwork) {
  const crop = state.edit.crop || { x: 0, y: 0, w: 1, h: 1 };
  const srcX = Math.round(artwork.image.naturalWidth * crop.x);
  const srcY = Math.round(artwork.image.naturalHeight * crop.y);
  const srcW = Math.max(1, Math.round(artwork.image.naturalWidth * crop.w));
  const srcH = Math.max(1, Math.round(artwork.image.naturalHeight * crop.h));
  const maxSide = artwork.type === 'svg' ? 1500 : 900;
  const scale = artwork.type === 'svg'
    ? maxSide / Math.max(srcW, srcH)
    : Math.min(maxSide / srcW, maxSide / srcH, 1);
  let width = Math.max(12, Math.round(srcW * scale));
  let height = Math.max(12, Math.round(srcH * scale));
  let canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  let ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(artwork.image, srcX, srcY, srcW, srcH, 0, 0, width, height);
  let img = ctx.getImageData(0, 0, width, height);
  let data = img.data;
  if (state.removeBg) {
    removeConnectedBackgroundFromImageData(data, width, height);
    ctx.putImageData(img, 0, 0);
  }
  ({ canvas, ctx, img, data, width, height } = tightenProcessedCanvasToVisibleArtwork(canvas, ctx, img, width, height));
  const paletteClusters = artwork.palette?.length
    ? artwork.palette.map((rgb, idx) => ({ original: idx, rgb: rgb.map(Number), count: 0 }))
    : null;
  let clusters = paletteClusters || [];
  const clusterTolerance = getColourClusterTolerance();
  const alphaMask = new Uint8Array(width * height);
  const alphaValues = new Uint8Array(width * height);
  const regionIndex = new Int16Array(width * height).fill(-1);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a < 28) {
        data[i + 3] = 0;
        continue;
      }
      const rgb = [data[i], data[i + 1], data[i + 2]];
      const idx = paletteClusters ? paletteClusters[nearestCluster(paletteClusters, rgb)].original : findOrCreateCluster(clusters, rgb, a, clusterTolerance);
      if (paletteClusters) paletteClusters[idx].count += a / 255;
      alphaMask[y * width + x] = 1;
      alphaValues[y * width + x] = a;
      regionIndex[y * width + x] = idx;
    }
  }
  ctx.putImageData(img, 0, 0);

  clusters = clusters.filter((cluster) => cluster.count > 1);
  clusters.sort((a, b) => b.count - a.count);
  const sourceClusters = clusters;
  const stableClusters = selectStableColourClusters(sourceClusters, regionIndex, alphaMask, alphaValues, width, height);
  const activeClusters = rankActiveColourClusters(sourceClusters, stableClusters);
  const sourceByOriginal = new Map(sourceClusters.map((cluster) => [cluster.original, cluster]));
  const naturalColourCount = Math.min(Math.max(stableClusters.length || sourceClusters.length, 1), 8);
  const requestedColourCount = clamp(Number(state.targetColorCount) || 8, 1, 8);
  const colourLimit = state.frontColoursCustomized ? requestedColourCount : naturalColourCount;
  const main = activeClusters.slice(0, colourLimit);
  const remap = new Map(main.map((cluster, idx) => [cluster.original, idx]));
  for (let i = 0; i < regionIndex.length; i += 1) {
    if (!alphaMask[i] || !main.length) continue;
    const mapped = remap.get(regionIndex[i]);
    regionIndex[i] = mapped ?? nearestCluster(main, sourceByOriginal.get(regionIndex[i])?.rgb);
  }
  main.forEach((cluster, idx) => {
    cluster.id = idx;
    cluster.hex = rgbToHex(cluster.rgb);
    cluster.mask = new Uint8Array(width * height);
  });
  for (let i = 0; i < regionIndex.length; i += 1) {
    if (alphaMask[i] && regionIndex[i] >= 0) main[regionIndex[i]].mask[i] = 1;
  }

  const silhouette = buildSilhouette(alphaMask, width, height);
  const minIslandPixels = Math.max(10, Math.round((width * height) * 0.00045));
  const regionPaths = main.map((cluster) => ({
    ...cluster,
    path: maskToSvgPath(cluster.mask, width, height, 4),
    components: countComponents(cluster.mask, width, height, minIslandPixels),
  }));
  const islands = regionPaths.reduce((sum, region) => sum + Math.max(0, region.components - 1), 0);
  const opaqueCount = alphaMask.reduce((sum, value) => sum + value, 0);
  const tinyShapes = regionPaths.filter((region) => region.count / Math.max(opaqueCount, 1) < 0.012).length;

  return {
    width,
    height,
    aspect: width / height,
    artworkType: artwork.type,
    artworkUrl: canvas.toDataURL('image/png'),
    artworkCanvas: canvas,
    naturalColourCount,
    alphaMask,
    alphaValues,
    regionIndex,
    colours: regionPaths,
    silhouette,
    warnings: buildWarnings({ artwork, clusters: sourceClusters, main, islands, tinyShapes, opaqueCount, width, height }),
  };
}

function getColourClusterTolerance() {
  const requested = clamp(Number(state.targetColorCount) || 8, 1, 8);
  if (requested >= 4) return Math.min(state.tolerance, 34);
  if (requested === 3) return Math.min(state.tolerance, 46);
  return state.tolerance;
}

function selectStableColourClusters(clusters, regionIndex, alphaMask, alphaValues, width, height) {
  const stats = new Map(clusters.map((cluster) => [cluster.original, { interior: 0, count: cluster.count }]));
  let opaqueCount = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      if (!alphaMask[index]) continue;
      opaqueCount += 1;
      if (alphaValues[index] < 230) continue;
      const region = regionIndex[index];
      const sameRegion =
        regionIndex[index - 1] === region
        && regionIndex[index + 1] === region
        && regionIndex[index - width] === region
        && regionIndex[index + width] === region;
      if (sameRegion) stats.get(region).interior += 1;
    }
  }
  if (!opaqueCount) return clusters;
  const minInterior = Math.max(10, Math.round(opaqueCount * 0.0015));
  const minShare = Math.max(10, opaqueCount * 0.006);
  const stable = clusters.filter((cluster) => {
    const stat = stats.get(cluster.original);
    const interiorRatio = stat ? stat.interior / Math.max(cluster.count, 1) : 0;
    return stat
      && cluster.count >= minShare
      && ((stat.interior >= minInterior && interiorRatio >= 0.22) || cluster.count >= opaqueCount * 0.18);
  });
  return stable.length ? stable : clusters;
}

function rankActiveColourClusters(sourceClusters, stableClusters) {
  const ranked = [];
  const seen = new Set();
  stableClusters.forEach((cluster) => {
    ranked.push(cluster);
    seen.add(cluster.original);
  });
  sourceClusters.forEach((cluster) => {
    if (seen.has(cluster.original)) return;
    ranked.push(cluster);
    seen.add(cluster.original);
  });
  return ranked.length ? ranked : sourceClusters;
}

function averageCornerColour(data, width, height) {
  const samples = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  const sum = [0, 0, 0];
  let count = 0;
  samples.forEach(([x, y]) => {
    const i = (y * width + x) * 4;
    if (data[i + 3] > 20) {
      sum[0] += data[i];
      sum[1] += data[i + 1];
      sum[2] += data[i + 2];
      count += 1;
    }
  });
  return count ? sum.map((value) => value / count) : [255, 255, 255];
}

function removeConnectedBackgroundFromImageData(data, width, height) {
  const bg = averageCornerColour(data, width, height);
  const mask = buildConnectedBackgroundMask(data, width, height, bg, state.tolerance);
  for (let i = 0; i < mask.length; i += 1) {
    if (!mask[i]) continue;
    const o = i * 4;
    data[o + 3] = 0;
  }
  return mask;
}

function tightenProcessedCanvasToVisibleArtwork(canvas, ctx, img, width, height) {
  const bounds = getImageDataAlphaBounds(img.data, width, height, 28);
  if (!bounds) return { canvas, ctx, img, data: img.data, width, height };
  const pad = Math.max(2, Math.round(Math.max(bounds.w, bounds.h) * 0.012));
  const x = Math.max(0, bounds.x - pad);
  const y = Math.max(0, bounds.y - pad);
  const right = Math.min(width, bounds.x + bounds.w + pad);
  const bottom = Math.min(height, bounds.y + bounds.h + pad);
  const croppedWidth = Math.max(1, right - x);
  const croppedHeight = Math.max(1, bottom - y);
  if (croppedWidth === width && croppedHeight === height) {
    return { canvas, ctx, img, data: img.data, width, height };
  }

  const nextCanvas = document.createElement('canvas');
  nextCanvas.width = croppedWidth;
  nextCanvas.height = croppedHeight;
  const nextCtx = nextCanvas.getContext('2d', { willReadFrequently: true });
  nextCtx.clearRect(0, 0, croppedWidth, croppedHeight);
  nextCtx.drawImage(canvas, x, y, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight);
  const nextImg = nextCtx.getImageData(0, 0, croppedWidth, croppedHeight);
  return {
    canvas: nextCanvas,
    ctx: nextCtx,
    img: nextImg,
    data: nextImg.data,
    width: croppedWidth,
    height: croppedHeight,
  };
}

function getImageDataAlphaBounds(data, width, height, alphaThreshold = 1) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] < alphaThreshold) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function buildConnectedBackgroundMask(data, width, height, bg, tolerance) {
  const threshold = Math.max(42, tolerance * 1.28);
  const mask = new Uint8Array(width * height);
  const queue = [];
  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (mask[index]) return;
    const o = index * 4;
    const alpha = data[o + 3];
    const rgb = [data[o], data[o + 1], data[o + 2]];
    if (alpha < 28 || colourDistance(rgb, bg) <= threshold) {
      mask[index] = 1;
      queue.push(index);
    }
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    const x = current % width;
    const y = Math.floor(current / width);
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }
  return mask;
}

function findOrCreateCluster(clusters, rgb, alpha, tolerance) {
  let best = -1;
  let bestDistance = Infinity;
  clusters.forEach((cluster, idx) => {
    const distance = colourDistance(rgb, cluster.rgb);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = idx;
    }
  });
  if (best >= 0 && bestDistance <= tolerance) {
    const cluster = clusters[best];
    const nextCount = cluster.count + alpha / 255;
    cluster.rgb = cluster.rgb.map((value, i) => (value * cluster.count + rgb[i]) / nextCount);
    cluster.count = nextCount;
    return cluster.original;
  }
  const original = clusters.length;
  clusters.push({ original, rgb: rgb.map(Number), count: alpha / 255 });
  return original;
}

function nearestCluster(clusters, rgb = [0, 0, 0]) {
  let best = 0;
  let distance = Infinity;
  clusters.forEach((cluster, idx) => {
    const next = colourDistance(rgb, cluster.rgb);
    if (next < distance) {
      distance = next;
      best = idx;
    }
  });
  return best;
}

function buildSilhouette(mask, width, height) {
  let count = 0;
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i]) count += 1;
  }
  if (!count) return defaultSilhouette();

  const clean = keepPrintableMaskComponents(mask, width, height, Math.max(16, Math.round(count * 0.00018)));
  const traced = traceMaskOutline(clean, width, height);
  if (traced.length >= 12) {
    const smoothed = smoothPolygon(traced, 1);
    const simplified = simplifyPolygon(smoothed, Math.max(1.1, Math.max(width, height) / 980));
    return simplified.map(([x, y]) => [
      clamp(x / width, 0, 1),
      clamp(y / height, 0, 1),
    ]);
  }
  return buildEnvelopeSilhouette(clean, width, height);
}

function buildEnvelopeSilhouette(mask, width, height) {
  const rows = [];
  const pad = Math.max(2, Math.round(Math.max(width, height) / 460));
  for (let y = 0; y < height; y += 1) {
    let minX = width;
    let maxX = -1;
    for (let x = 0; x < width; x += 1) {
      if (!clean[y * width + x]) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
    if (maxX >= 0) rows.push({ y, minX: Math.max(0, minX - pad), maxX: Math.min(width - 1, maxX + pad) });
  }
  if (rows.length < 3) return defaultSilhouette();

  const step = Math.max(1, Math.round(Math.max(width, height) / 520));
  const left = [];
  const right = [];
  rows.forEach((row, idx) => {
    if (idx % step && idx !== rows.length - 1) return;
    left.push([row.minX, row.y]);
    right.push([row.maxX, row.y]);
  });

  const outline = [...left, ...right.reverse()];
  const smoothed = smoothPolygon(outline, 2);
  const simplified = simplifyPolygon(smoothed, Math.max(1.2, Math.max(width, height) / 760));
  return simplified.map(([x, y]) => [
    clamp(x / width, 0, 1),
    clamp(y / height, 0, 1),
  ]);
}

function traceMaskOutline(mask, width, height) {
  const edgeMap = new Map();
  const edges = [];
  const addEdge = (ax, ay, bx, by) => {
    const edge = { ax, ay, bx, by, from: `${ax},${ay}`, to: `${bx},${by}`, used: false };
    edges.push(edge);
    const bucket = edgeMap.get(edge.from);
    if (bucket) bucket.push(edge);
    else edgeMap.set(edge.from, [edge]);
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!mask[y * width + x]) continue;
      if (y === 0 || !mask[(y - 1) * width + x]) addEdge(x, y, x + 1, y);
      if (x === width - 1 || !mask[y * width + x + 1]) addEdge(x + 1, y, x + 1, y + 1);
      if (y === height - 1 || !mask[(y + 1) * width + x]) addEdge(x + 1, y + 1, x, y + 1);
      if (x === 0 || !mask[y * width + x - 1]) addEdge(x, y + 1, x, y);
    }
  }

  let bestLoop = [];
  let bestArea = 0;
  edges.forEach((startEdge) => {
    if (startEdge.used) return;
    const loop = [];
    let edge = startEdge;
    const startKey = startEdge.from;
    for (let guard = 0; edge && !edge.used && guard < edges.length + 4; guard += 1) {
      edge.used = true;
      loop.push([edge.ax, edge.ay]);
      const nextKey = edge.to;
      if (nextKey === startKey) break;
      const nextEdges = edgeMap.get(nextKey) || [];
      edge = chooseNextOutlineEdge(edge, nextEdges);
    }
    if (loop.length < 12) return;
    const area = Math.abs(polygonArea(loop));
    if (area > bestArea) {
      bestArea = area;
      bestLoop = loop;
    }
  });
  return bestLoop;
}

function chooseNextOutlineEdge(previous, candidates) {
  const available = candidates.filter((edge) => !edge.used);
  if (available.length <= 1) return available[0] || null;
  const px = previous.bx - previous.ax;
  const py = previous.by - previous.ay;
  let best = available[0];
  let bestScore = -Infinity;
  available.forEach((edge) => {
    const nx = edge.bx - edge.ax;
    const ny = edge.by - edge.ay;
    const dot = px * nx + py * ny;
    const cross = px * ny - py * nx;
    const score = dot * 3 - Math.abs(cross);
    if (score > bestScore) {
      bestScore = score;
      best = edge;
    }
  });
  return best;
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const next = points[(i + 1) % points.length];
    area += points[i][0] * next[1] - next[0] * points[i][1];
  }
  return area / 2;
}

function keepPrintableMaskComponents(mask, width, height, minPixels) {
  const output = new Uint8Array(mask.length);
  const seen = new Uint8Array(mask.length);
  const stack = [];
  const component = [];
  for (let i = 0; i < mask.length; i += 1) {
    if (!mask[i] || seen[i]) continue;
    seen[i] = 1;
    stack.push(i);
    component.length = 0;
    while (stack.length) {
      const current = stack.pop();
      component.push(current);
      const x = current % width;
      const y = Math.floor(current / width);
      [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ].forEach(([nx, ny]) => {
        const ni = ny * width + nx;
        if (nx >= 0 && ny >= 0 && nx < width && ny < height && mask[ni] && !seen[ni]) {
          seen[ni] = 1;
          stack.push(ni);
        }
      });
    }
    if (component.length >= minPixels) {
      component.forEach((index) => {
        output[index] = 1;
      });
    }
  }
  return output.some((value) => value) ? output : mask;
}

function defaultSilhouette() {
  return [
    [0.18, 0.16],
    [0.82, 0.16],
    [0.88, 0.52],
    [0.7, 0.86],
    [0.3, 0.86],
    [0.12, 0.52],
  ];
}

function smoothPolygon(points, passes) {
  let output = points;
  for (let pass = 0; pass < passes; pass += 1) {
    const input = output;
    output = input.map((point, idx) => {
      const prev = input[(idx - 1 + input.length) % input.length];
      const next = input[(idx + 1) % input.length];
      return [(prev[0] + point[0] * 2 + next[0]) / 4, (prev[1] + point[1] * 2 + next[1]) / 4];
    });
  }
  return output;
}

function simplifyPolygon(points, tolerance) {
  if (points.length <= 24) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  simplifyRange(points, 0, points.length - 1, tolerance * tolerance, keep);
  const simplified = points.filter((_, idx) => keep[idx]);
  return simplified.length >= 12 ? simplified : points;
}

function simplifyRange(points, first, last, toleranceSq, keep) {
  let bestDistance = 0;
  let bestIndex = -1;
  for (let i = first + 1; i < last; i += 1) {
    const distance = pointLineDistanceSq(points[i], points[first], points[last]);
    if (distance > bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  if (bestDistance > toleranceSq && bestIndex > 0) {
    keep[bestIndex] = 1;
    simplifyRange(points, first, bestIndex, toleranceSq, keep);
    simplifyRange(points, bestIndex, last, toleranceSq, keep);
  }
}

function pointLineDistanceSq(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (!dx && !dy) {
    const px = point[0] - start[0];
    const py = point[1] - start[1];
    return px * px + py * py;
  }
  const t = clamp(((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy), 0, 1);
  const x = start[0] + dx * t;
  const y = start[1] + dy * t;
  const px = point[0] - x;
  const py = point[1] - y;
  return px * px + py * py;
}

function maskToSvgPath(mask, width, height, step) {
  const sx = 1000 / width;
  const sy = 1000 / height;
  const rects = [];
  for (let y = 0; y < height; y += step) {
    let x = 0;
    while (x < width) {
      while (x < width && !blockHasPixel(mask, width, height, x, y, step)) x += step;
      const start = x;
      while (x < width && blockHasPixel(mask, width, height, x, y, step)) x += step;
      if (x > start) rects.push([start * sx - 500, y * sy - 500, (x - start) * sx, step * sy]);
    }
  }
  return rects
    .map(([x, y, w, h]) => `M${x.toFixed(1)} ${y.toFixed(1)}h${w.toFixed(1)}v${h.toFixed(1)}h${(-w).toFixed(1)}z`)
    .join('');
}

function blockHasPixel(mask, width, height, bx, by, step) {
  for (let y = by; y < Math.min(height, by + step); y += 1) {
    for (let x = bx; x < Math.min(width, bx + step); x += 1) {
      if (mask[y * width + x]) return true;
    }
  }
  return false;
}

function countComponents(mask, width, height, minPixels = 1) {
  const seen = new Uint8Array(mask.length);
  let components = 0;
  const stack = [];
  for (let i = 0; i < mask.length; i += 1) {
    if (!mask[i] || seen[i]) continue;
    seen[i] = 1;
    stack.push(i);
    let pixels = 0;
    while (stack.length) {
      const current = stack.pop();
      pixels += 1;
      const x = current % width;
      const y = Math.floor(current / width);
      [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ].forEach(([nx, ny]) => {
        const ni = ny * width + nx;
        if (nx >= 0 && ny >= 0 && nx < width && ny < height && mask[ni] && !seen[ni]) {
          seen[ni] = 1;
          stack.push(ni);
        }
      });
    }
    if (pixels >= minPixels) components += 1;
  }
  return components;
}

function buildWarnings({ artwork, clusters, main, islands, tinyShapes, opaqueCount, width, height }) {
  const warnings = [];
  if (!opaqueCount) warnings.push({ level: 'error', text: 'No opaque logo area was detected after background removal.' });
  if (clusters.length > 8) {
    warnings.push({ level: 'warn', text: `${clusters.length} source colours were merged to the 8-colour print limit.` });
  }
  if (artwork.type === 'png') {
    warnings.push({ level: 'warn', text: 'PNG geometry is approximated from pixels. Upload SVG for cleaner separate printable colour parts.' });
  }
  if (artwork.gradients) warnings.push({ level: 'warn', text: 'SVG gradients are unsupported for separate diffuser parts and were flattened.' });
  if (artwork.pathCount > 90) warnings.push({ level: 'warn', text: 'Artwork has many vector shapes; simplify paths before production export.' });
  if (islands > 10) warnings.push({ level: 'warn', text: `${islands} floating colour islands detected. They may need bridges or separate print handling.` });
  if (tinyShapes > 0) warnings.push({ level: 'warn', text: `${tinyShapes} tiny colour region${tinyShapes > 1 ? 's' : ''} may be too small for diffuser fit.` });
  if (opaqueCount / (width * height) < 0.08) warnings.push({ level: 'warn', text: 'The silhouette is very sparse; internal islands may need manual support.' });
  if (main.length <= 8 && !warnings.length) warnings.push({ level: 'ok', text: 'Artwork is within the 8-colour print limit and ready for preview export.' });
  return warnings;
}

function renderPreview() {
  if (!state.processed) {
    renderEmptyPreview();
    return;
  }
  const { processed } = state;
  const polygon = processed.silhouette
    .map(([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`)
    .join(', ');
  els.modelStack.style.setProperty('--silhouette', `polygon(${polygon})`);
  els.modelStack.style.setProperty('--artwork-aspect', processed.aspect);
  els.stage.classList.remove('preview-ready');
  applyShellColours();
  applyRotation();
  buildThreeModel();

  const svgSize = getPreviewSvgSize(processed.aspect);
  els.frontSvg.setAttribute('viewBox', `${-svgSize.width / 2} ${-svgSize.height / 2} ${svgSize.width} ${svgSize.height}`);
  const svgPolygon = processed.silhouette.map(([x, y]) => `${x * svgSize.width - svgSize.width / 2},${y * svgSize.height - svgSize.height / 2}`).join(' ');
  const mappedArtwork = renderMappedArtworkUrl(processed);
  const lidArtwork = mappedArtwork
    ? `<image class="lid-artwork" href="${escapeHtml(mappedArtwork)}" x="${-svgSize.width / 2}" y="${-svgSize.height / 2}" width="${svgSize.width}" height="${svgSize.height}" preserveAspectRatio="xMidYMid meet"></image>`
    : processed.colours.map((region) => `<path d="${region.path}" fill="${region.hex}" opacity="0.98"></path>`).join('');
  els.frontSvg.innerHTML = `
    <defs>
      <clipPath id="silhouetteClip"><polygon points="${svgPolygon}"></polygon></clipPath>
      <mask id="frameMask">
        <rect x="${-svgSize.width / 2 - 20}" y="${-svgSize.height / 2 - 20}" width="${svgSize.width + 40}" height="${svgSize.height + 40}" fill="black"></rect>
        <polygon points="${svgPolygon}" fill="white"></polygon>
        <polygon points="${scalePoints(processed.silhouette, 0.9, svgSize.width, svgSize.height)}" fill="black"></polygon>
      </mask>
      <filter id="softLidShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="#000000" flood-opacity="0.26"></feDropShadow>
      </filter>
    </defs>
    <g class="diffuser-lid" clip-path="url(#silhouetteClip)" filter="url(#softLidShadow)">
      ${lidArtwork}
      <polygon points="${svgPolygon}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="12"></polygon>
      <rect x="${-svgSize.width / 2}" y="${-svgSize.height / 2}" width="${svgSize.width}" height="${svgSize.height}" fill="rgba(255,255,255,.10)"></rect>
      <path d="M${-svgSize.width / 2} ${-svgSize.height * 0.42} C${-svgSize.width * 0.11} ${-svgSize.height * 0.54} ${svgSize.width * 0.22} ${-svgSize.height * 0.46} ${svgSize.width / 2} ${-svgSize.height * 0.31} L${svgSize.width / 2} ${-svgSize.height / 2} L${-svgSize.width / 2} ${-svgSize.height / 2}Z" fill="rgba(255,255,255,.18)"></path>
    </g>
    <rect class="front-rim" x="${-svgSize.width / 2 - 20}" y="${-svgSize.height / 2 - 20}" width="${svgSize.width + 40}" height="${svgSize.height + 40}" fill="#101413" mask="url(#frameMask)"></rect>
  `;

  renderPreviewTitle();
  renderShellColourControls();
  updateStats();
  updateProjectControls();
}

function renderEmptyPreview() {
  applyShellColours();
  clearThreeModel();
  renderPreviewAlert([]);
  renderPreviewTitle();
  els.stage.classList.remove('three-active');
  els.stage.classList.remove('preview-ready');
  els.frontSvg.setAttribute('viewBox', '-500 -500 1000 1000');
  els.frontSvg.innerHTML = '';
  applyRotation();
  updateProjectControls();
}

function renderDiagnostics() {
  if (!state.processed) {
    renderPreviewAlert([]);
    return;
  }
  const warnings = state.processed.warnings;
  setWarnings(warnings);
  renderPreviewAlert(state.isDefaultPreview ? [] : warnings);
  const warnCount = warnings.filter((warning) => warning.level === 'warn').length;
  const hasError = warnings.some((warning) => warning.level === 'error');
  els.complexityScore.textContent = hasError ? 'Blocked' : warnCount ? `${warnCount} warning${warnCount > 1 ? 's' : ''}` : 'Good';
}

function setWarnings(warnings) {
  els.warnings.innerHTML = warnings.map((warning) => `<li class="${warning.level}">${warning.text}</li>`).join('');
}

function renderPreviewAlert(warnings) {
  if (!els.previewAlert) return;
  const visibleWarnings = warnings.filter((warning) => warning.level === 'warn' || warning.level === 'error');
  const signature = visibleWarnings.map((warning) => `${warning.level}:${warning.text}`).join('|');
  if (!visibleWarnings.length) {
    els.previewAlert.hidden = true;
    els.previewAlert.innerHTML = '';
    els.previewAlert.dataset.signature = '';
    return;
  }
  if (state.dismissedPreviewAlert === signature) {
    els.previewAlert.hidden = true;
    els.previewAlert.dataset.signature = signature;
    return;
  }
  const hasError = visibleWarnings.some((warning) => warning.level === 'error');
  els.previewAlert.hidden = false;
  els.previewAlert.dataset.signature = signature;
  els.previewAlert.classList.toggle('error', hasError);
  els.previewAlert.classList.remove('expanded');
  els.previewAlert.innerHTML = `
    <button class="preview-alert-trigger" type="button" data-open-preview-alert aria-label="Open print checks"><span aria-hidden="true">!</span></button>
    <button class="preview-alert-close" type="button" data-close-preview-alert aria-label="Close print checks">x</button>
    <div class="preview-alert-content">
      <strong>${hasError ? 'Needs attention' : 'Print checks'}</strong>
      <ul>${visibleWarnings.slice(0, 3).map((warning) => `<li>${escapeHtml(warning.text)}</li>`).join('')}</ul>
    </div>
  `;
}

function scalePoints(points, scale, width = 1000, height = 1000) {
  const cx = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const cy = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  return points.map(([x, y]) => `${(cx + (x - cx) * scale) * width - width / 2},${(cy + (y - cy) * scale) * height - height / 2}`).join(' ');
}

function applyRotation() {
  els.modelStack.style.transform = `rotateX(${state.rotation.x}deg) rotateY(${state.rotation.y}deg) rotateZ(${state.rotation.z}deg)`;
  if (state.three?.group && window.THREE) {
    state.three.group.rotation.x = THREE.Math.degToRad(state.rotation.x);
    state.three.group.rotation.y = THREE.Math.degToRad(state.rotation.y);
    state.three.group.rotation.z = THREE.Math.degToRad(state.rotation.z);
    renderThree();
  }
}

function resetRotation() {
  state.rotation = { x: 0, y: 0, z: 0 };
  applyRotation();
}

function updateStats() {
  const preset = SIZE_PRESETS[state.size];
  const usage = USAGE_PRESETS[state.usage] || USAGE_PRESETS.indoor;
  els.sizeOutput.textContent = preset.label;
  if (els.usageOutput) els.usageOutput.textContent = usage.label;
  els.dimensionStat.textContent = `${preset.label} - ${usage.label}`;
  if (els.depthStat) els.depthStat.textContent = `${preset.depth} mm depth`;
}

function applyShellColours() {
  const side = normalizeHex(state.shellColours.side);
  const back = normalizeHex(state.shellColours.back);
  els.modelStack.style.setProperty('--side-color', side);
  els.modelStack.style.setProperty('--side-color-dark', shadeHex(side, -24));
  els.modelStack.style.setProperty('--side-color-light', shadeHex(side, 18));
  els.modelStack.style.setProperty('--back-color', back);
  els.modelStack.style.setProperty('--back-color-dark', shadeHex(back, -22));
  els.modelStack.style.setProperty('--back-color-light', shadeHex(back, 16));
}

function renderShellColourControls() {
  const colours = state.processed?.colours || [];
  els.frontPlateColours.innerHTML = colours.length
    ? colours.map((region, idx) => {
      const hex = getDisplayColour(idx, region.hex);
      return `<button class="plate-dot" type="button" data-front-colour="${idx}" style="background:${hex}" aria-label="Edit front colour ${idx + 1}"></button>`;
    }).join('')
    : '<span class="plate-empty">Upload artwork</span>';
  els.frontPlateColours.querySelectorAll('[data-front-colour]').forEach((button) => {
    button.addEventListener('click', () => openFrontColourPopover(Number(button.dataset.frontColour), button));
  });
  const side = normalizeHex(state.shellColours.side);
  const back = normalizeHex(state.shellColours.back);
  els.sideColourButton.querySelector('i').style.background = side;
  els.backColourButton.querySelector('i').style.background = back;
  els.sideColourHex.textContent = side;
  els.backColourHex.textContent = back;
  applyShellColours();
}

function updateProjectControls() {
  if (!els.saveProject) return;
  const disabled = !state.processed || !state.artwork;
  els.saveProject.disabled = disabled;
  if (els.placeOrder) els.placeOrder.disabled = disabled || !state.uploadedFile;
}

function getDesignName() {
  return state.designName.trim() || 'My Custom LED Sign';
}

function renderPreviewTitle() {
  els.previewTitle.textContent = state.isDefaultPreview ? 'Example lightbox preview' : getDesignName();
  els.designName.value = state.designName || '';
}

function startDesignNameEdit() {
  if (state.isDefaultPreview) {
    state.isDefaultPreview = false;
    if (!state.designName.trim()) state.designName = '';
  }
  els.previewTitle.hidden = true;
  els.editDesignName.hidden = true;
  els.designName.hidden = false;
  els.designName.value = state.designName.trim() || getDesignName();
  els.designName.focus();
  els.designName.select();
}

function finishDesignNameEdit() {
  if (els.designName.hidden) return;
  state.designName = els.designName.value.trim();
  els.designName.hidden = true;
  els.previewTitle.hidden = false;
  els.editDesignName.hidden = false;
  renderPreviewTitle();
  updateProjectControls();
}

async function saveProjectFile() {
  if (!state.processed || !state.artwork) return;
  setStatus('Saving');
  els.saveProject.disabled = true;
  try {
    const project = await buildSignGuyProject();
    state.projectId = project.id;
    const localSave = isLocalTesting();
    if (localSave) {
      if (state.isAdmin) downloadProjectPayload(project);
    } else {
      await uploadProjectFolder(project);
    }
    try {
      await saveProjectRecord(project);
      await refreshProjectLog();
    } catch (storageError) {
      console.warn(storageError);
      els.projectNote.textContent = localSave
        ? 'The .SignGuy file was downloaded, but the local recent list could not be updated.'
        : 'The server folder was saved, but the local recent list could not be updated.';
    }
    els.projectNote.textContent = localSave
      ? state.isAdmin
        ? `${project.name}.SignGuy downloaded and logged for local testing.`
        : `${project.name} saved to the local Saved designs list. Login as admin to download .SignGuy files.`
      : `${project.name} saved to the ${state.customerEmail} server folder.`;
    setStatus('Saved');
  } catch (error) {
    console.error(error);
    els.projectNote.textContent = isLocalTesting()
      ? 'Could not download this .SignGuy file.'
      : 'Could not save this project folder on the server.';
    setStatus('Save failed');
  } finally {
    updateProjectControls();
  }
}

async function placeOrderRequest() {
  if (!state.processed || !state.uploadedFile) return;
  setStatus('Preparing order');
  if (els.submitDesign) els.submitDesign.disabled = true;
  els.placeOrder.disabled = true;
  els.saveProject.disabled = true;
  try {
    const project = await buildSignGuyProject();
    state.projectId = project.id;
    const localOrder = isLocalTesting();
    const screenshots = await captureSubmissionScreenshots();
    const uploadResult = localOrder
      ? { ok: true, localTesting: true, emailSent: false }
      : await uploadProjectFolder(project, {
        screenshots,
        sendOrderEmail: true,
        subject: ORDER_SUBMISSION_SUBJECT,
        message: makeEmailBody('Shopify checkout order started'),
      });
    if (localOrder) downloadProjectPayload(project);
    try {
      await saveProjectRecord(project);
      await refreshProjectLog();
    } catch (storageError) {
      console.warn(storageError);
    }
    els.submitNote.textContent = localOrder
      ? `${project.name}.SignGuy downloaded for local checkout testing. Email is only sent from the deployed site.`
      : `${project.name} saved. Redirecting to checkout.`;
    setStatus('Checkout');
    redirectToShopifyCheckout(project, uploadResult);
  } catch (error) {
    console.error(error);
    els.submitNote.textContent = describeOrderError(error);
    setStatus('Order failed');
    updateProjectControls();
    if (els.submitDesign) els.submitDesign.disabled = false;
  }
}

async function openProjectFiles(fileList) {
  const file = fileList?.[0];
  if (!file) return;
  setStatus('Opening');
  try {
    const project = JSON.parse(await file.text());
    project.customerEmail = state.customerEmail;
    await restoreSignGuyProject(project);
    try {
      await saveProjectRecord(project);
      await refreshProjectLog();
    } catch (storageError) {
      console.warn(storageError);
    }
    els.projectNote.textContent = `${file.name} opened.`;
    setStatus('Project open');
  } catch (error) {
    console.error(error);
    els.projectNote.textContent = 'That file could not be opened as a .SignGuy project.';
    setStatus('Open failed');
  } finally {
    els.projectFileInput.value = '';
  }
}

async function buildSignGuyProject() {
  renderThree();
  const screenshotBlob = await captureVisualizerBlob();
  const screenshotDataUrl = await blobToDataUrl(screenshotBlob);
  const now = new Date().toISOString();
  const sourceName = state.fileName || state.artwork?.name || `${baseName()}.png`;
  return {
    type: 'SignGuy.LightboxStudio',
    version: PROJECT_FILE_VERSION,
    id: state.projectId || makeProjectId(),
    name: getDesignName(),
    customerEmail: state.customerEmail,
    savedAt: now,
    source: {
      fileName: sourceName,
      artworkType: state.artwork.type,
      dataUrl: state.artwork.dataUrl,
      pathCount: state.artwork.pathCount || 0,
      gradients: state.artwork.gradients || 0,
      palette: state.artwork.palette || null,
      hasTransparency: Boolean(state.artwork.hasTransparency),
    },
    config: {
      size: state.size,
      usage: state.usage,
      designName: state.designName,
      illuminated: state.illuminated,
      removeBg: state.removeBg,
      tolerance: state.tolerance,
      targetColorCount: state.targetColorCount,
      colorOverrides: [...state.colorOverrides],
      frontColoursCustomized: state.frontColoursCustomized,
      shellColours: { ...state.shellColours },
      edit: {
        crop: { ...state.edit.crop },
        cropAspect: state.edit.cropAspect,
        zoom: state.edit.zoom,
      },
      rotation: { ...state.rotation },
      previewZoom: state.previewZoom,
    },
    preview: {
      screenshotDataUrl,
      colours: (state.processed?.colours || []).map((region, idx) => ({
        index: idx,
        source: region.hex,
        display: getDisplayColour(idx, region.hex),
      })),
      dimensions: {
        faceInches: SIZE_PRESETS[state.size].inches,
        depthMm: SIZE_PRESETS[state.size].depth,
        usage: USAGE_PRESETS[state.usage]?.label || USAGE_PRESETS.indoor.label,
      },
    },
  };
}

async function restoreSignGuyProject(project) {
  validateSignGuyProject(project);
  const config = project.config || {};
  const source = project.source;
  const image = await loadImage(source.dataUrl);
  state.isDefaultPreview = false;
  state.projectId = project.id || makeProjectId();
  state.fileName = source.fileName || `${project.name || 'saved-design'}.${source.artworkType || 'png'}`;
  state.designName = config.designName || project.name || '';
  state.artwork = {
    type: source.artworkType || inferArtworkType(source.dataUrl, source.fileName),
    image,
    dataUrl: source.dataUrl,
    pathCount: source.pathCount || 0,
    gradients: source.gradients || 0,
    palette: source.palette || null,
    hasTransparency: source.hasTransparency ?? imageHasTransparency(image),
    name: state.fileName,
  };
  state.uploadedFile = dataUrlToFile(source.dataUrl, state.fileName);
  renderUploadControl();
  state.size = SIZE_PRESETS[config.size] ? config.size : 'large';
  state.usage = USAGE_PRESETS[config.usage] ? config.usage : 'indoor';
  state.illuminated = Boolean(config.illuminated);
  state.removeBg = Boolean(config.removeBg);
  state.tolerance = clamp(Number(config.tolerance) || 64, 18, 90);
  state.targetColorCount = clamp(Number(config.targetColorCount) || 8, 1, 8);
  state.colorOverrides = Array.isArray(config.colorOverrides) ? [...config.colorOverrides] : [];
  state.frontColoursCustomized = Boolean(config.frontColoursCustomized);
  state.shellColours = {
    side: normalizeHex(config.shellColours?.side || '#000000'),
    back: normalizeHex(config.shellColours?.back || '#000000'),
  };
  state.edit = {
    crop: normalizeCrop(config.edit?.crop || { x: 0, y: 0, w: 1, h: 1 }),
    cropAspect: CROP_PRESETS.some((preset) => preset.id === config.edit?.cropAspect) ? config.edit.cropAspect : 'free',
    zoom: clamp(Number(config.edit?.zoom) || 1, 0.4, 2.4),
  };
  state.rotation = {
    x: Number(config.rotation?.x) || 0,
    y: Number(config.rotation?.y) || 0,
    z: Number(config.rotation?.z) || 0,
  };
  state.previewZoom = clamp(Number(config.previewZoom) || 1, 0.55, 2.4);
  applyStateToControls();
  closeWizard();
  await reprocess({ preserveTargetColorCount: true });
  if (els.submitDesign) els.submitDesign.disabled = !state.uploadedFile;
}

function validateSignGuyProject(project) {
  if (!project || project.type !== 'SignGuy.LightboxStudio' || !project.source?.dataUrl) {
    throw new Error('Unsupported .SignGuy project file.');
  }
}

function applyStateToControls() {
  els.removeBg.checked = state.removeBg;
  els.illuminateToggle.checked = state.illuminated;
  els.designName.value = state.designName || '';
  document.querySelectorAll('[data-size]').forEach((button) => {
    button.classList.toggle('active', button.dataset.size === state.size);
  });
  document.querySelectorAll('[data-usage]').forEach((button) => {
    button.classList.toggle('active', button.dataset.usage === state.usage);
  });
  applyIllumination();
  applyPreviewZoom();
  updateStats();
  renderShellColourControls();
  updateProjectControls();
}

async function refreshProjectLog() {
  if (!state.customerEmail) {
    state.savedProjects = [];
    renderProjectLog();
    return;
  }
  try {
    state.savedProjects = await getProjectRecords();
    renderProjectLog();
  } catch (error) {
    console.warn(error);
    els.projectList.innerHTML = '<p class="project-empty">Recent saves unavailable.</p>';
    els.projectNote.textContent = 'Use Open .SignGuy to load saved project files.';
  }
}

function renderProjectLog() {
  const projects = state.savedProjects || [];
  els.projectCount.textContent = String(projects.length);
  if (!projects.length) {
    els.projectList.innerHTML = `<p class="project-empty">No saved designs for ${escapeHtml(state.customerEmail || 'this email')} yet.</p>`;
    els.projectNote.textContent = '';
    return;
  }
  els.projectList.innerHTML = projects.map((project) => `
    <article class="project-item" data-load-project="${escapeHtml(project.id)}">
      <button class="project-delete" type="button" data-delete-project="${escapeHtml(project.id)}" aria-label="Delete ${escapeHtml(project.name || 'saved design')}">x</button>
      <img class="project-thumb" src="${escapeHtml(project.preview?.screenshotDataUrl || project.source?.dataUrl || '')}" alt="" />
      <div class="project-meta">
        <strong>${escapeHtml(project.name || 'saved-design')}</strong>
        <span>${escapeHtml(project.source?.fileName || 'Sign Studio project')} · ${formatProjectDate(project.savedAt)}</span>
        <div class="project-item-actions">
          <button class="project-mini" type="button" data-load-project="${escapeHtml(project.id)}">Open</button>
          ${state.isAdmin ? `<button class="project-mini" type="button" data-download-project="${escapeHtml(project.id)}">Download</button>` : ''}
        </div>
      </div>
    </article>
  `).join('');
  els.projectList.querySelectorAll('article[data-load-project]').forEach((item) => {
    item.addEventListener('click', async (event) => {
      if (event.target.closest('[data-delete-project], [data-download-project]')) return;
      const project = await getProjectRecord(item.dataset.loadProject);
      await restoreSignGuyProject(project);
      els.projectNote.textContent = `${project.name}.SignGuy restored from recent saves.`;
      setStatus('Project open');
    });
  });
  els.projectList.querySelectorAll('[data-download-project]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!state.isAdmin) return;
      const project = await getProjectRecord(button.dataset.downloadProject);
      downloadProjectPayload(project);
      els.projectNote.textContent = `${project.name}.SignGuy downloaded.`;
    });
  });
  els.projectList.querySelectorAll('[data-delete-project]').forEach((button) => {
    button.addEventListener('click', async () => {
      await deleteProjectRecord(button.dataset.deleteProject);
      await refreshProjectLog();
      els.projectNote.textContent = 'Saved design deleted.';
    });
  });
}

function downloadProjectPayload(project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/x-signguy+json' });
  downloadBlob(blob, `${projectFileBaseName(project)}.SignGuy`, 'application/x-signguy+json');
}

async function uploadProjectFolder(project, options = {}) {
  const endpoint = getProjectSaveEndpoint();
  if (!endpoint) throw new Error('Project save endpoint is unavailable.');
  const projectName = `${projectFileBaseName(project)}.SignGuy`;
  const logoFile = state.uploadedFile || dataUrlToFile(project.source.dataUrl, project.source.fileName || `${baseName()}.png`);
  const screenshots = options.screenshots || await captureSubmissionScreenshots();
  const form = new FormData();
  form.append('customerEmail', project.customerEmail || state.customerEmail);
  form.append('projectName', projectName);
  if (options.sendOrderEmail) {
    form.append('sendOrderEmail', 'true');
    form.append('subject', options.subject || ORDER_SUBMISSION_SUBJECT);
    form.append('message', options.message || makeEmailBody('Shopify checkout order started'));
  }
  form.append('projectFile', new Blob([JSON.stringify(project, null, 2)], { type: 'application/x-signguy+json' }), projectName);
  form.append('logo', logoFile, logoFile.name || project.source.fileName || 'uploaded-logo');
  screenshots.forEach((shot, idx) => {
    form.append(`renderScreenshot${idx + 1}`, shot.file, shot.file.name);
    form.append(`renderScreenshot${idx + 1}Label`, shot.label);
  });
  const response = await fetch(endpoint, {
    method: 'POST',
    body: form,
  });
  if (!response.ok) {
    let detail = '';
    try {
      detail = await response.text();
    } catch {
      detail = '';
    }
    throw new Error(`Project save endpoint returned ${response.status}${detail ? `: ${detail.slice(0, 160)}` : ''}`);
  }
  try {
    return await response.json();
  } catch {
    return { ok: true, projectName };
  }
}

function getProjectSaveEndpoint() {
  if (window.SIGN_GUY_PROJECT_SAVE_ENDPOINT) return window.SIGN_GUY_PROJECT_SAVE_ENDPOINT;
  if (isLocalTesting()) return '';
  if (!window.location.protocol.startsWith('http')) return '';
  return new URL('/api/save-project', window.location.href).href;
}

function isLocalTesting() {
  const { protocol, hostname } = window.location;
  return protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function redirectToShopifyCheckout(project, uploadResult = {}) {
  const variantId = getShopifyVariantId();
  if (!variantId) throw new Error('No matching Shopify variant was found.');
  const projectName = `${projectFileBaseName(project)}.SignGuy`;
  const params = new URLSearchParams();
  if (state.customerEmail) params.set('checkout[email]', state.customerEmail);
  params.set('attributes[Customer email]', state.customerEmail || '');
  params.set('attributes[Design name]', project.name || getDesignName());
  params.set('attributes[Studio size]', SIZE_PRESETS[state.size].label);
  params.set('attributes[Usage]', USAGE_PRESETS[state.usage]?.label || USAGE_PRESETS.indoor.label);
  params.set('attributes[SignGuy file]', projectName);
  window.location.href = `${SHOPIFY_CHECKOUT_BASE_URL}/${variantId}:1?${params.toString()}`;
}

function getShopifyVariantId() {
  return SHOPIFY_CUSTOM_LOGO_BAR_LIGHT_VARIANTS[state.size]?.[state.usage] || '';
}

function describeOrderError(error) {
  if (error?.message?.includes('Project save endpoint is unavailable')) {
    return isLocalTesting()
      ? 'Could not prepare the local checkout test. Try saving the design first, then place the order again.'
      : 'Could not reach the project save endpoint. The order was not started because the design folder must be saved first.';
  }
  if (error?.message?.includes('Project save endpoint returned')) {
    return `${error.message}. The order was not started because the design folder must be saved first.`;
  }
  if (error?.message?.includes('Failed to fetch')) {
    return 'Could not reach /api/save-project. The order was not started because the design folder must be saved first.';
  }
  if (error?.message?.includes('Submission endpoint')) {
    return `${error.message}. The order was not started because the logo and visualizer screenshots email could not be sent.`;
  }
  if (error?.message?.includes('send submission')) {
    return `${error.message}. The order was not started because the logo and visualizer screenshots email could not be sent.`;
  }
  if (error?.message?.includes('Shopify variant')) {
    return 'Could not match this size and usage to a checkout product variant.';
  }
  return 'Could not prepare this order. Try again after the preview finishes loading.';
}

function projectFileBaseName(project) {
  return projectExportBaseName(project).replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'lightbox-design';
}

function projectExportBaseName(project) {
  const customName = String(project.config?.designName || '').trim();
  if (customName) return customName;
  const sourceName = String(project.source?.fileName || '').replace(/\.[^.]+$/, '').trim();
  if (sourceName) return sourceName;
  const projectName = String(project.name || '').trim();
  if (projectName && projectName !== 'My Custom LED Sign') return projectName;
  return 'lightbox-design';
}

function formatProjectDate(value) {
  if (!value) return 'unsaved';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function makeProjectId() {
  return window.crypto?.randomUUID?.() || `signguy-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function openProjectDb() {
  if (!window.indexedDB) return Promise.reject(new Error('IndexedDB is unavailable.'));
  if (projectDbPromise) return projectDbPromise;
  projectDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(PROJECT_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECT_STORE_NAME)) {
        const store = db.createObjectStore(PROJECT_STORE_NAME, { keyPath: 'id' });
        store.createIndex('savedAt', 'savedAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open the project log.'));
  });
  return projectDbPromise;
}

async function saveProjectRecord(project) {
  const db = await openProjectDb();
  const tx = db.transaction(PROJECT_STORE_NAME, 'readwrite');
  tx.objectStore(PROJECT_STORE_NAME).put(project);
  await transactionDone(tx);
  await pruneProjectRecords();
}

async function getProjectRecords() {
  const db = await openProjectDb();
  const tx = db.transaction(PROJECT_STORE_NAME, 'readonly');
  const records = await requestResult(tx.objectStore(PROJECT_STORE_NAME).getAll());
  const email = normalizeEmail(state.customerEmail);
  await transactionDone(tx);
  return records
    .filter((project) => normalizeEmail(project.customerEmail) === email)
    .sort((a, b) => String(b.savedAt || '').localeCompare(String(a.savedAt || '')))
    .slice(0, PROJECT_LOG_LIMIT);
}

async function getProjectRecord(id) {
  const db = await openProjectDb();
  const tx = db.transaction(PROJECT_STORE_NAME, 'readonly');
  const project = await requestResult(tx.objectStore(PROJECT_STORE_NAME).get(id));
  await transactionDone(tx);
  if (!project) throw new Error('Saved project was not found.');
  if (normalizeEmail(project.customerEmail) !== normalizeEmail(state.customerEmail)) {
    throw new Error('Saved project belongs to a different email address.');
  }
  return project;
}

async function deleteProjectRecord(id) {
  const db = await openProjectDb();
  const tx = db.transaction(PROJECT_STORE_NAME, 'readwrite');
  tx.objectStore(PROJECT_STORE_NAME).delete(id);
  await transactionDone(tx);
}

async function pruneProjectRecords() {
  const db = await openProjectDb();
  const tx = db.transaction(PROJECT_STORE_NAME, 'readwrite');
  const store = tx.objectStore(PROJECT_STORE_NAME);
  const records = await requestResult(store.getAll());
  const email = normalizeEmail(state.customerEmail);
  records
    .filter((project) => normalizeEmail(project.customerEmail) === email)
    .sort((a, b) => String(b.savedAt || '').localeCompare(String(a.savedAt || '')))
    .slice(PROJECT_LOG_LIMIT)
    .forEach((project) => store.delete(project.id));
  await transactionDone(tx);
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Database request failed.'));
  });
}

function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Database transaction failed.'));
    tx.onabort = () => reject(tx.error || new Error('Database transaction aborted.'));
  });
}

async function submitDesignRequest() {
  if (!state.processed || !state.uploadedFile) return;
  setStatus('Submitting');
  if (els.submitDesign) els.submitDesign.disabled = true;
  try {
    const screenshots = await captureSubmissionScreenshots();
    const subject = SUBMISSION_SUBJECT;
    const body = makeEmailBody();
    const endpoint = getSubmissionEndpoint();

    if (endpoint) {
      await submitDesignToEndpoint({ endpoint, subject, body, screenshots });
      setStatus('Submitted');
      els.submitNote.textContent = `Submitted to ${CONTACT_EMAIL} with the logo and ${screenshots.length} visualizer screenshots.`;
      return;
    }

    screenshots.forEach((item) => downloadBlob(item.blob, item.file.name, 'image/png'));
    openMailDraft(subject, `${body}\n\nAttach the uploaded logo file and the downloaded visualizer screenshots before sending.`);
    els.submitNote.textContent = 'Automatic email is only available on the deployed Vercel site. A pre-addressed email draft was opened and the visualizer screenshots were downloaded.';
    setStatus('Email draft');
  } catch (error) {
    console.error(error);
    els.submitNote.textContent = describeSubmitError(error);
    setStatus('Submit failed');
  } finally {
    if (els.submitDesign) els.submitDesign.disabled = false;
  }
}

function getSubmissionEndpoint() {
  if (window.SIGN_GUY_SUBMISSION_ENDPOINT) return window.SIGN_GUY_SUBMISSION_ENDPOINT;
  if (!window.location.protocol.startsWith('http')) return '';
  return new URL('/api/submit-design', window.location.href).href;
}

function describeSubmitError(error) {
  if (error?.message?.includes('3D preview')) {
    return 'Could not capture the visualizer screenshots. Wait for the preview to finish loading, then try again.';
  }
  if (error?.message?.includes('Submission endpoint returned')) {
    return `${error.message}. Check Vercel Function Logs and SMTP environment variables.`;
  }
  if (error?.message?.includes('Failed to fetch')) {
    return 'Could not reach /api/submit-design. Make sure api/submit-design.js was pushed to GitHub and redeployed on Vercel.';
  }
  return 'Could not send this submission. Check the Vercel function logs and try again.';
}

async function captureSubmissionScreenshots() {
  const originalRotation = { ...state.rotation };
  const shots = [];
  try {
    shots.push({
      label: 'Current visualizer view',
      blob: await captureVisualizerBlob(),
      fileName: `${baseName()}-visualizer-current.png`,
    });
    state.rotation = { x: -4, y: 34, z: 0 };
    applyRotation();
    await waitFrame();
    shots.push({
      label: 'Angled side view',
      blob: await captureVisualizerBlob(),
      fileName: `${baseName()}-visualizer-angled.png`,
    });
  } finally {
    state.rotation = originalRotation;
    applyRotation();
  }
  return shots.map((shot) => ({
    ...shot,
    file: new File([shot.blob], shot.fileName, { type: 'image/png' }),
  }));
}

async function submitDesignToEndpoint({ endpoint, subject, body, screenshots }) {
  const form = new FormData();
  form.append('to', CONTACT_EMAIL);
  form.append('subject', subject);
  form.append('message', body);
  form.append('customerEmail', state.customerEmail);
  form.append('signName', getDesignName());
  form.append('uploadedFileName', state.fileName || state.uploadedFile?.name || 'logo file');
  form.append('size', SIZE_PRESETS[state.size].label);
  form.append('usage', USAGE_PRESETS[state.usage]?.label || USAGE_PRESETS.indoor.label);
  form.append('depthMm', String(SIZE_PRESETS[state.size].depth));
  form.append('sideColour', normalizeHex(state.shellColours.side));
  form.append('backColour', normalizeHex(state.shellColours.back));
  form.append('frontColours', JSON.stringify((state.processed?.colours || []).map((region, idx) => getDisplayColour(idx, region.hex))));
  form.append('logo', state.uploadedFile, state.uploadedFile.name || 'uploaded-logo');
  screenshots.forEach((shot, idx) => {
    form.append(`renderScreenshot${idx + 1}`, shot.file, shot.file.name);
    form.append(`renderScreenshot${idx + 1}Label`, shot.label);
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    body: form,
  });
  if (!response.ok) {
    let detail = '';
    try {
      detail = await response.text();
    } catch {
      detail = '';
    }
    throw new Error(`Submission endpoint returned ${response.status}${detail ? `: ${detail.slice(0, 160)}` : ''}`);
  }
}

function captureVisualizerBlob() {
  return new Promise((resolve, reject) => {
    const source = state.three?.renderer?.domElement;
    if (!source) {
      reject(new Error('The 3D preview is not ready yet.'));
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#303333');
    gradient.addColorStop(0.58, '#272928');
    gradient.addColorStop(1, '#3e4140');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const halo = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.48, 0, canvas.width * 0.5, canvas.height * 0.48, canvas.width * 0.32);
    halo.addColorStop(0, state.illuminated ? 'rgba(125,145,175,0.45)' : 'rgba(98,110,121,0.22)');
    halo.addColorStop(1, 'rgba(98,110,121,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('The visualizer screenshot could not be captured.'));
    }, 'image/png');
  });
}

function makeEmailBody(context = 'Design submission') {
  const preset = SIZE_PRESETS[state.size];
  const usage = USAGE_PRESETS[state.usage] || USAGE_PRESETS.indoor;
  const colours = (state.processed?.colours || [])
    .map((region, idx) => `Colour ${idx + 1}: ${getDisplayColour(idx, region.hex)}`)
    .join('\n');
  return [
    'Custom lightbox request',
    '',
    `Context: ${context}`,
    `Customer email: ${state.customerEmail || 'Not provided'}`,
    `Sign name: ${getDesignName()}`,
    `Uploaded file: ${state.fileName || 'logo file'}`,
    `Size: ${preset.label}`,
    `Usage: ${usage.label}`,
    `Depth: ${preset.depth} mm`,
    `Preview lighting: ${state.illuminated ? 'Illuminated' : 'Not illuminated'}`,
    `Side colour: ${normalizeHex(state.shellColours.side)}`,
    `Back colour: ${normalizeHex(state.shellColours.back)}`,
    `Render screenshots: current visualizer view and angled side view`,
    '',
    'Detected front colours:',
    colours || 'None detected',
  ].join('\n');
}

function openMailDraft(subject, body) {
  const url = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const link = document.createElement('a');
  link.href = url;
  link.click();
}

function exportStlBundle() {
  if (!state.processed) return;
  const files = makeModelFiles();
  downloadBlob(makeZip(files), `${baseName()}-lightbox-stl.zip`, 'application/zip');
}

function export3mf() {
  if (!state.processed) return;
  const model = make3mfModel();
  const files = [
    { name: '[Content_Types].xml', data: textBytes(`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`) },
    { name: '_rels/.rels', data: textBytes(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`) },
    { name: '3D/3dmodel.model', data: textBytes(model) },
  ];
  downloadBlob(makeZip(files), `${baseName()}-lightbox.3mf`, 'model/3mf');
}

function makeModelFiles() {
  const p = state.processed;
  const preset = SIZE_PRESETS[state.size];
  const outline = normalizedOutline(p.silhouette, preset.inches * 25.4);
  const inner = offsetOutline(outline, -7);
  const files = [
    { name: `side_wall_${state.shellColours.side.replace('#', '')}.stl`, data: textBytes(makeRingStl('side_wall', outline, inner, 0, preset.depth)) },
  ];
  files.push({ name: `back_plate_${state.shellColours.back.replace('#', '')}.stl`, data: textBytes(makeSolidStl('back_plate', offsetOutline(outline, -4), -3, 0)) });
  p.colours.forEach((region, idx) => {
    const hex = getDisplayColour(idx, region.hex);
    files.push({
      name: `front_diffuser_colour_${idx + 1}_${hex.replace('#', '')}.stl`,
      data: textBytes(makeRegionStl(`front_diffuser_colour_${idx + 1}`, region.mask, p.width, p.height, outline.scale, 0, 2.2)),
    });
  });
  return files;
}

function make3mfModel() {
  const p = state.processed;
  const preset = SIZE_PRESETS[state.size];
  const outline = normalizedOutline(p.silhouette, preset.inches * 25.4);
  const mesh = meshForSolid(offsetOutline(outline, -2), 0, preset.depth * 0.18);
  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <metadata name="Title">${escapeXml(baseName())} LED lightbox shell preview</metadata>
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>${mesh.vertices.map((v) => `<vertex x="${v[0].toFixed(3)}" y="${v[1].toFixed(3)}" z="${v[2].toFixed(3)}"/>`).join('')}</vertices>
        <triangles>${mesh.triangles.map((t) => `<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`).join('')}</triangles>
      </mesh>
    </object>
  </resources>
  <build><item objectid="1"/></build>
</model>`;
}

function normalizedOutline(points, targetMm) {
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = targetMm / Math.max(maxX - minX, maxY - minY);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const outline = points.map(([x, y]) => [(x - cx) * scale, (cy - y) * scale]);
  outline.scale = scale;
  return outline;
}

function offsetOutline(points, amount) {
  const cx = points.reduce((sum, point) => sum + point[0], 0) / points.length;
  const cy = points.reduce((sum, point) => sum + point[1], 0) / points.length;
  const maxR = Math.max(...points.map(([x, y]) => Math.hypot(x - cx, y - cy)));
  const scale = clamp((maxR + amount) / maxR, 0.72, 1.18);
  return points.map(([x, y]) => [cx + (x - cx) * scale, cy + (y - cy) * scale]);
}

function makeSolidStl(name, outline, z0, z1) {
  const mesh = meshForSolid(outline, z0, z1);
  return meshToAsciiStl(name, mesh);
}

function makeRingStl(name, outer, inner, z0, z1) {
  const vertices = [];
  const triangles = [];
  outer.forEach(([x, y]) => vertices.push([x, y, z0], [x, y, z1]));
  inner.forEach(([x, y]) => vertices.push([x, y, z0], [x, y, z1]));
  const n = outer.length;
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    triangles.push([i * 2, j * 2, i * 2 + 1], [i * 2 + 1, j * 2, j * 2 + 1]);
    triangles.push([n * 2 + i * 2 + 1, n * 2 + j * 2 + 1, n * 2 + i * 2], [n * 2 + i * 2, n * 2 + j * 2 + 1, n * 2 + j * 2]);
    triangles.push([i * 2 + 1, j * 2 + 1, n * 2 + i * 2 + 1], [n * 2 + i * 2 + 1, j * 2 + 1, n * 2 + j * 2 + 1]);
    triangles.push([i * 2, n * 2 + i * 2, j * 2], [j * 2, n * 2 + i * 2, n * 2 + j * 2]);
  }
  return meshToAsciiStl(name, { vertices, triangles });
}

function meshForSolid(outline, z0, z1) {
  const vertices = [];
  const triangles = [];
  outline.forEach(([x, y]) => vertices.push([x, y, z0], [x, y, z1]));
  const bottomCenter = vertices.push([0, 0, z0]) - 1;
  const topCenter = vertices.push([0, 0, z1]) - 1;
  const n = outline.length;
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    triangles.push([bottomCenter, j * 2, i * 2], [topCenter, i * 2 + 1, j * 2 + 1]);
    triangles.push([i * 2, j * 2, i * 2 + 1], [i * 2 + 1, j * 2, j * 2 + 1]);
  }
  return { vertices, triangles };
}

function makeRegionStl(name, mask, width, height, scale, z0, z1) {
  const cell = scale;
  const x0 = (width - 1) / 2;
  const y0 = (height - 1) / 2;
  const vertices = [];
  const triangles = [];
  const sample = Math.max(2, Math.ceil(Math.max(width, height) / 46));
  const addBox = (x, y, w, h) => {
    const left = (x - x0) * cell;
    const right = (x + w - x0) * cell;
    const top = (y0 - y) * cell;
    const bottom = (y0 - y - h) * cell;
    const base = vertices.length;
    vertices.push([left, bottom, z0], [right, bottom, z0], [right, top, z0], [left, top, z0], [left, bottom, z1], [right, bottom, z1], [right, top, z1], [left, top, z1]);
    triangles.push([base, base + 1, base + 2], [base, base + 2, base + 3], [base + 4, base + 6, base + 5], [base + 4, base + 7, base + 6], [base, base + 4, base + 5], [base, base + 5, base + 1], [base + 1, base + 5, base + 6], [base + 1, base + 6, base + 2], [base + 2, base + 6, base + 7], [base + 2, base + 7, base + 3], [base + 3, base + 7, base + 4], [base + 3, base + 4, base]);
  };
  for (let y = 0; y < height; y += sample) {
    let x = 0;
    while (x < width) {
      while (x < width && !blockHasPixel(mask, width, height, x, y, sample)) x += sample;
      const start = x;
      while (x < width && blockHasPixel(mask, width, height, x, y, sample)) x += sample;
      if (x > start) addBox(start, y, x - start, sample);
    }
  }
  return meshToAsciiStl(name, { vertices, triangles });
}

function meshToAsciiStl(name, mesh) {
  const lines = [`solid ${name}`];
  mesh.triangles.forEach(([a, b, c]) => {
    const normal = faceNormal(mesh.vertices[a], mesh.vertices[b], mesh.vertices[c]);
    lines.push(` facet normal ${normal.map(formatNumber).join(' ')}`, '  outer loop');
    [a, b, c].forEach((idx) => lines.push(`   vertex ${mesh.vertices[idx].map(formatNumber).join(' ')}`));
    lines.push('  endloop', ' endfacet');
  });
  lines.push(`endsolid ${name}`);
  return lines.join('\n');
}

function faceNormal(a, b, c) {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  const len = Math.hypot(...n) || 1;
  return n.map((value) => value / len);
}

function makeZip(files) {
  const encoder = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  files.forEach((file) => {
    const name = encoder.encode(file.name);
    const data = file.data instanceof Uint8Array ? file.data : encoder.encode(String(file.data));
    const crc = crc32(data);
    const local = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ]);
    chunks.push(local);
    central.push(
      concatBytes([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        name,
      ]),
    );
    offset += local.length;
  });
  const centralStart = offset;
  const centralBlob = concatBytes(central);
  const end = concatBytes([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(centralBlob.length), u32(centralStart), u16(0)]);
  return new Blob([...chunks, centralBlob, end], { type: 'application/zip' });
}

function crc32(bytes) {
  let crc = -1;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}

function u16(value) {
  return new Uint8Array([value & 255, (value >>> 8) & 255]);
}

function u32(value) {
  return new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]);
}

function concatBytes(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  parts.forEach((part) => {
    out.set(part, offset);
    offset += part.length;
  });
  return out;
}

function textBytes(text) {
  return new TextEncoder().encode(text);
}

function safeFileName(value) {
  return String(value || 'file').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').replace(/^-|-$/g, '') || 'file';
}

function downloadBlob(blob, filename, type) {
  const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function colourDistance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function rgbToHex(rgb) {
  return `#${rgb.map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function normalizeHex(value) {
  const raw = String(value || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
  }
  return '#ffffff';
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  return [
    parseInt(normalized.slice(1, 3), 16),
    parseInt(normalized.slice(3, 5), 16),
    parseInt(normalized.slice(5, 7), 16),
  ];
}

function shadeHex(hex, amount) {
  const rgb = hexToRgb(hex).map((value) => clamp(value + amount, 0, 255));
  return rgbToHex(rgb);
}

function makeThreeColour(hex) {
  const colour = new THREE.Color(normalizeHex(hex));
  if (colour.convertSRGBToLinear) colour.convertSRGBToLinear();
  return colour;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function waitFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function waitMs(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function setLoadingProgress(value) {
  if (!els.loadingProgressBar) return;
  loadingProgress.target = Math.max(loadingProgress.target, clamp(Number(value) || 0, 0, 100));
  if (!loadingProgress.raf) {
    loadingProgress.raf = requestAnimationFrame(animateLoadingProgress);
  }
}

function animateLoadingProgress() {
  const distance = loadingProgress.target - loadingProgress.current;
  loadingProgress.current += distance * 0.08;
  if (loadingProgress.target >= 100 && loadingProgress.current > 99.3) {
    loadingProgress.current = 100;
  }
  if (els.loadingProgressBar) {
    els.loadingProgressBar.style.width = `${loadingProgress.current.toFixed(2)}%`;
  }
  if (Math.abs(loadingProgress.target - loadingProgress.current) > 0.15) {
    loadingProgress.raf = requestAnimationFrame(animateLoadingProgress);
    return;
  }
  loadingProgress.current = loadingProgress.target;
  if (els.loadingProgressBar) {
    els.loadingProgressBar.style.width = `${loadingProgress.current.toFixed(2)}%`;
  }
  loadingProgress.raf = null;
}

async function finishAppLoading() {
  setLoadingProgress(100);
  while (performance.now() - loadingProgress.startedAt < LOADING_MIN_VISIBLE_MS || loadingProgress.current < 99) {
    await waitMs(50);
  }
  hideAppLoading();
}

function hideAppLoading() {
  document.body.classList.remove('studio-loading');
  if (els.appLoading) els.appLoading.classList.add('hidden');
}

function setStatus(text) {
  els.statusPill.textContent = text;
}

function baseName() {
  const name = state.designName.trim() || state.fileName || getDesignName();
  return name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'my-custom-led-sign';
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toFixed(5) : '0.00000';
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]);
}

function escapeHtml(value) {
  return String(value).replace(/[<>&"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[char]);
}
