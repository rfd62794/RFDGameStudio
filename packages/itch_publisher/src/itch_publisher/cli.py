"""Command line: ``itch-publisher [--config games.yaml] deploy | list | report``."""

from __future__ import annotations

import click

from .config import load_game_config, load_games, resolve_config_path
from .itchio import check_butler, push


@click.group()
@click.option(
    "--config",
    "config_path",
    type=click.Path(dir_okay=False),
    default=None,
    help="Path to games.yaml (default: $ITCH_PUBLISHER_CONFIG, then ./games.yaml).",
)
@click.pass_context
def cli(ctx, config_path):
    """Push HTML5 game builds to itch.io with butler."""
    ctx.obj = {"config_path": config_path}


def _unreadable_config(obj, exc):
    return click.ClickException(f"Cannot read {resolve_config_path(obj['config_path'])}: {exc}")


@cli.command()
@click.argument("game_name")
@click.option("--target", default="itchio", help="Deployment target (itchio)")
@click.option("--dry-run", is_flag=True, help="Print command without executing")
@click.pass_obj
def deploy(obj, game_name, target, dry_run):
    """Deploy a game to the specified target."""
    if target != "itchio":
        raise click.ClickException(f"Unknown target: {target}. Available: itchio")

    if not check_butler():
        raise click.ClickException("butler not found. Install from https://itch.io/docs/butler/")

    try:
        load_game_config(game_name, obj["config_path"])
    except KeyError:
        raise click.ClickException(f"Game not found: {game_name}. Run `itch-publisher list` to see options")
    except OSError as exc:
        raise _unreadable_config(obj, exc)

    if not push(game_name, config_path=obj["config_path"], dry_run=dry_run):
        raise click.ClickException(f"Deployment to {target} failed")
    if not dry_run:
        click.echo(f"Deployment to {target} completed successfully")


@cli.command("list")
@click.pass_obj
def list_games(obj):
    """List all configured games."""
    try:
        games = load_games(obj["config_path"])
    except OSError as exc:
        raise _unreadable_config(obj, exc)

    if not games:
        click.echo("No games configured.")
        return
    click.echo("Configured games:")
    for game_name in games:
        click.echo(f"  - {game_name}")


@cli.command()
@click.option(
    "--metadata",
    "metadata_path",
    type=click.Path(dir_okay=False),
    default=None,
    help="JSON file keyed by game name with version / deployed_version fields.",
)
@click.pass_obj
def report(obj, metadata_path):
    """Compare source, deployed and live itch.io versions."""
    from .report import build_report, format_markdown

    click.echo(format_markdown(build_report(obj["config_path"], metadata_path)))


def main():
    cli()


if __name__ == "__main__":
    main()
