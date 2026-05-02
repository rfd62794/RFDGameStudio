import click
import yaml
import os
from targets.itchio import check_butler, push, load_game_config


@click.group()
def cli():
    """RFD_IT_Publishing - Private deployment pipeline for RFD IT Services projects."""
    pass


@cli.command()
@click.argument('game_name')
@click.option('--target', default='itchio', help='Deployment target (itchio)')
@click.option('--dry-run', is_flag=True, help='Print command without executing')
def deploy(game_name, target, dry_run):
    """Deploy a game to the specified target."""
    if target != 'itchio':
        click.echo(f"Unknown target: {target}. Available: itchio")
        return
    
    if not check_butler():
        click.echo("Error: butler not found. Install from https://itch.io/docs/butler/")
        return
    
    try:
        load_game_config(game_name)
    except KeyError:
        click.echo(f"Game not found: {game_name}. Run `python publisher.py list` to see options")
        return
    
    if push(game_name, dry_run=dry_run):
        if not dry_run:
            click.echo(f"Deployment to {target} completed successfully")
    else:
        click.echo(f"Deployment to {target} failed")


@cli.command()
def list():
    """List all configured games."""
    config_path = os.path.join(os.path.dirname(__file__), "config", "games.yaml")
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    
    games = config.get("games", {})
    if games:
        click.echo("Configured games:")
        for game_name in games.keys():
            click.echo(f"  - {game_name}")
    else:
        click.echo("No games configured.")


if __name__ == '__main__':
    cli()
