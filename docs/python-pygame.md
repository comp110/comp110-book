---
title: Pygame Browser Game
description: A playable pygame-style browser game that can be edited and rerun in the page.
---

# Pygame in the browser

This demo uses the same editable Python runner as the earlier examples, with small browser-backed `pygame` and `physics2d` modules for drawing, keyboard input, and simple 2D gravity. Press **Run**, click the canvas, then use WASD or the arrow keys to catch the bouncing ball.

<div class="python-game-demo" data-python-game-demo markdown="1">

<canvas class="python-game-demo__canvas" data-python-game-canvas width="640" height="360" tabindex="0" aria-label="Pygame browser game canvas">
  Your browser does not support the canvas element.
</canvas>

```python_runner
from __future__ import annotations

from random import uniform

import physics2d
import pygame


WIDTH = 640
HEIGHT = 360
PLAY_TOP = 48
PLAY_BOTTOM = HEIGHT - 42
GRAVITY = (0.0, 130.0)

pygame.init()
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Gravity Catch")
font = pygame.font.SysFont("arial", 22, bold=True)
small_font = pygame.font.SysFont("arial", 16)

world = physics2d.World(
    gravity=GRAVITY,
    bounds=(0.0, float(PLAY_TOP), float(WIDTH), float(PLAY_BOTTOM - PLAY_TOP)),
)
ball = world.add(
    physics2d.CircleBody(
        WIDTH * 0.55,
        PLAY_TOP + 36,
        14,
        vx=95.0,
        vy=-35.0,
        bounce=0.9,
        friction=0.998,
    )
)
catcher = pygame.Rect(WIDTH // 2 - 54, PLAY_BOTTOM - 31, 108, 18)
score = 0
time_left = 45.0
fps = 0.0
message = "Catch the low-gravity physics ball."


def launch_ball() -> None:
    ball.position = (uniform(90, WIDTH - 90), PLAY_TOP + 35)
    ball.set_velocity(uniform(-135, 135), uniform(-60, 5))


def reset() -> None:
    global score, time_left, message
    score = 0
    time_left = 45.0
    message = "Catch the low-gravity physics ball."
    catcher.center = (WIDTH // 2, PLAY_BOTTOM - 22)
    launch_ball()


def update(dt: float) -> None:
    global score, time_left, fps, message

    if dt > 0.0:
        current_fps = 1.0 / dt
        fps = current_fps if fps == 0.0 else fps * 0.9 + current_fps * 0.1

    for event in pygame.event.get():
        if event.type == pygame.KEYDOWN and event.key == pygame.K_r:
            reset()

    keys = pygame.key.get_pressed()
    direction = 0.0
    if keys[pygame.K_LEFT] or keys[pygame.K_a]:
        direction -= 1.0
    if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
        direction += 1.0

    catcher.move_ip(direction * 330.0 * dt, 0.0)
    catcher.clamp_ip(pygame.Rect(0, PLAY_TOP, WIDTH, PLAY_BOTTOM - PLAY_TOP))

    if time_left <= 0.0:
        message = "Time! Press R to restart."
        world.step(dt, substeps=3)
        return

    world.step(dt, substeps=3)
    time_left = max(0.0, time_left - dt)

    if physics2d.circle_overlaps_rect(ball, catcher):
        if ball.vy > 0.0 and ball.y < catcher.centery:
            score += 1
            message = "Caught it. Gravity is still pulling down."
            launch_ball()
        else:
            physics2d.bounce_circle_off_rect(ball, catcher, bounce=0.92)


def draw_gravity_vector() -> None:
    x = WIDTH - 52
    y = 82
    pygame.draw.line(screen, (148, 163, 184), (x, y), (x, y + 42), 3)
    pygame.draw.line(screen, (148, 163, 184), (x, y + 42), (x - 8, y + 30), 3)
    pygame.draw.line(screen, (148, 163, 184), (x, y + 42), (x + 8, y + 30), 3)
    label = small_font.render("g down", True, (148, 163, 184))
    screen.blit(label, (x - 30, y + 58))


def draw() -> None:
    screen.fill((15, 23, 42))
    pygame.draw.rect(screen, (30, 41, 59), pygame.Rect(0, 0, WIDTH, PLAY_TOP))
    pygame.draw.rect(screen, (51, 65, 85), pygame.Rect(0, PLAY_BOTTOM, WIDTH, HEIGHT - PLAY_BOTTOM))
    pygame.draw.line(screen, (71, 85, 105), (0, PLAY_BOTTOM), (WIDTH, PLAY_BOTTOM), 2)

    draw_gravity_vector()

    velocity_end = (ball.x + ball.vx * 0.18, ball.y + ball.vy * 0.18)
    pygame.draw.line(screen, (251, 146, 60), ball.position, velocity_end, 3)
    pygame.draw.circle(screen, (250, 204, 21), ball.position, ball.radius)
    pygame.draw.circle(screen, (146, 64, 14), ball.position, ball.radius, 3)

    pygame.draw.rect(screen, (56, 189, 248), catcher)
    pygame.draw.rect(screen, (14, 116, 144), catcher, 3)
    pygame.draw.rect(screen, (125, 211, 252), pygame.Rect(catcher.left, catcher.top - 10, 10, 14))
    pygame.draw.rect(screen, (125, 211, 252), pygame.Rect(catcher.right - 10, catcher.top - 10, 10, 14))

    score_text = font.render(f"Score {score}", True, (226, 232, 240))
    time_text = font.render(f"Time {time_left:04.1f}", True, (226, 232, 240))
    fps_text = small_font.render(f"FPS {fps:04.1f}", True, (148, 163, 184))
    gravity_text = small_font.render(f"Gravity ({GRAVITY[0]:.0f}, {GRAVITY[1]:.0f})", True, (203, 213, 225))
    hint_text = small_font.render(message, True, (203, 213, 225))
    screen.blit(score_text, (18, 24))
    screen.blit(fps_text, (WIDTH // 2 - 36, 24))
    screen.blit(time_text, (WIDTH - 126, 24))
    screen.blit(gravity_text, (18, HEIGHT - 22))
    screen.blit(hint_text, (WIDTH // 2 - 95, HEIGHT - 22))
    pygame.display.flip()


reset()
print("Game ready: physics2d gravity is (0, 130). Catch the bouncing ball.")

```

</div>
