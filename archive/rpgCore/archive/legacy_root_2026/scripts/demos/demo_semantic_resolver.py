"""
Quick Demo: Test Semantic Resolver Independently

This script lets you test if "I throw my beer at him" correctly maps to "distract"
WITHOUT needing Ollama running (no LLM required for this test).
"""

from rich.console import Console
from rich.table import Table

from src.semantic_engine import SemanticResolver, create_default_intent_library


def main():
    console = Console()
    
    console.print("[bold cyan]Semantic Intent Resolver - Standalone Demo[/bold cyan]\n")
    console.print("Loading embedding model (this may take a moment)...\n")
    
    # Initialize resolver with tuned threshold (0.35 = sweet spot)
    library = create_default_intent_library()
    resolver = SemanticResolver(library, confidence_threshold=0.35)
    
    console.print("[green]✓ Model loaded![/green]\n")
    
    # Test cases from your original question
    test_inputs = [
        "I throw my beer at him",
        "I kick the table to distract the guard",
        "I try to attack with my sword",
        "Can I convince him to let me pass?",
        "I sneak past the guard",
        "I use a health potion",
        "I flip the table over!",
        "I intimidate the bartender",
        "I search the room carefully"
    ]
    
    console.print("[bold]Testing Intent Resolution:[/bold]\n")
    
    # Create results table
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Player Input", style="cyan", width=50)
    table.add_column("Intent", style="green", width=20)
    table.add_column("Confidence", justify="right", style="yellow")
    
    for player_input in test_inputs:
        match = resolver.resolve_intent(player_input)
        
        if match:
            confidence_str = f"{match.confidence:.3f}"
            table.add_row(player_input, match.intent_id, confidence_str)
        else:
            table.add_row(player_input, "[red]NO MATCH[/red]", "0.000")
    
    console.print(table)
    
    # Interactive mode
    console.print("\n[bold]Interactive Mode[/bold] (type 'quit' to exit)\n")
    
    while True:
        try:
            user_input = console.input("[bold yellow]> Enter an action:[/bold yellow] ")
            
            if user_input.lower() in ["quit", "exit", "q"]:
                break
            
            match = resolver.resolve_intent(user_input)
            
            if match:
                console.print(
                    f"  [green]✓[/green] Matched: [bold]{match.intent_id}[/bold] "
                    f"(confidence: {match.confidence:.3f})"
                )
                console.print(f"  [dim]Description: {match.description}[/dim]\n")
            else:
                console.print("  [red]✗ No confident match found[/red]\n")
        
        except (KeyboardInterrupt, EOFError):
            break
    
    console.print("\n[cyan]Demo complete![/cyan]")


if __name__ == "__main__":
    main()
